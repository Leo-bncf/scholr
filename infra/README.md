# Infrastructure the console depends on

These files live on `scholr-prod`. They are kept here because a service that
exists only on a box and not in git is one nobody can rebuild after it is lost.

## `ilo-proxy.Caddyfile` + `ilo-proxy.service`

`/etc/scholr/ilo-proxy.Caddyfile` and `/etc/systemd/system/ilo-proxy.service`.

The Servers page reads the two hypervisors through their out-of-band
controllers. It cannot talk to them directly: the Supabase edge runtime
compiles its root store in, so it will never trust the internal CA that signed
the iLO certificates, however `DENO_CERT` or `SSL_CERT_FILE` are set. The
alternative to a relay is switching TLS verification off inside a function that
can power a hypervisor down, which is not a trade worth making.

So Caddy does the TLS: it checks each controller against the infrastructure CA
at `/etc/scholr/ilo-ca.crt` and hands the edge runtime plain HTTP on the docker
gateway.

    192.168.2.15  ──TLS, verified──  127.0.0.1 caddy :8099  ──plain──  edge runtime
    192.168.2.17  ──TLS, verified──  127.0.0.1 caddy :8100  ──plain──  edge runtime

Two things that are easy to get wrong:

  - **`bind` is what restricts the listener.** A site address of
    `http://172.18.0.1:8099` does *not* stop Caddy binding `0.0.0.0`; it
    listens on every interface and the whole LAN can reach the hop. Only the
    explicit `bind` line holds it to the docker gateway. Check with
    `ss -lntp | grep 809` — it must show `172.18.0.1:8099`, not `*:8099`.
  - **`tls_server_name` is per controller** and must match the name on its
    certificate, not its address.

Scholr runs its own copy rather than reusing the one on the Schedual host: it
is the same hardware and the same CA, but neither product's console should go
dark because the other one is down. The Schedual relay is bound to that host's
own docker gateway and has no route from here.

### The firewall rule, which is half the job

`ufw` is active on `scholr-prod` with a default-deny forward policy, so the
relay listening is not enough: traffic from the container to the gateway is
dropped, and the Servers page reports every controller "unreachable" with no
clue why. The rule has to name the bridge interface, because allowing the port
globally would open the hop to the LAN and undo the `bind`.

    BR="br-$(sudo docker network inspect supabase_default --format '{{.Id}}' | cut -c1-12)"
    sudo ufw allow in on "$BR" to 172.18.0.1 port 8099 proto tcp comment 'iLO relay for the edge runtime'
    sudo ufw allow in on "$BR" to 172.18.0.1 port 8100 proto tcp comment 'iLO relay .17'

The bridge name is derived from the docker network id, so **it changes if the
compose stack is recreated from scratch** and the rules then point at an
interface that no longer exists. If Servers starts saying "unreachable" after
infrastructure work, check this first:

    sudo docker run --rm --network supabase_default alpine:3.20 \
      sh -c 'apk add -q curl && curl -s -o /dev/null -w "%{http_code}\n" http://172.18.0.1:8099/redfish/v1/'

200 means the path is good. 000 means the firewall, not the relay.

### Rebuilding it

    sudo mkdir -p /etc/scholr
    sudo install -m 0644 ilo-ca.crt        /etc/scholr/ilo-ca.crt
    sudo install -m 0644 ilo-proxy.Caddyfile /etc/scholr/ilo-proxy.Caddyfile
    sudo install -m 0644 ilo-proxy.service /etc/systemd/system/ilo-proxy.service
    sudo caddy validate --config /etc/scholr/ilo-proxy.Caddyfile --adapter caddyfile
    sudo systemctl daemon-reload && sudo systemctl enable --now ilo-proxy

`ilo-ca.crt` is a certificate, not a key, and is not secret — but it is not in
this repo either, because it belongs to the infrastructure rather than to
Scholr. Copy it from `/etc/schedual/schedual-ca.crt` on the Schedual host.

## Environment

The console's hardware pages need these in `/opt/supabase/docker/.env` **and**
declared under the `functions` service in `docker-compose.yml` — the container
only sees what compose passes it, so adding to `.env` alone does nothing.

    TUYA_ACCESS_ID  TUYA_ACCESS_SECRET  TUYA_REGION  TUYA_DEVICE_ID
    ILO_HOSTS  ILO_USER  ILO_PASSWORD  ILO_CREDS  ILO_PROXY  ILO_PROXY_MAP
    IMOU_APP_ID  IMOU_APP_SECRET  IMOU_REGION  IMOU_DEVICE_ID  IMOU_CHANNEL_ID

`ILO_PROXY_MAP` points at this relay and `ILO_PROXY` is deliberately empty: a
host missing from the map should fail honestly rather than fall through to an
address with no route and hang for the full timeout.

`AUTOPILOT_SECRET` is deliberately **not** set here. It lets an unattended
caller reach `adminIlo` and `adminClimate` with no user behind it, bypassing
the super-admin check. Schedual needs it for its cooling autopilot; Scholr runs
none, and an unset secret means that door does not exist rather than being a
second copy of a key that opens power control.

These credentials now live on two hosts. Rotating any of them means doing it on
both `sched-prod` and `scholr-prod`; miss one and that console breaks quietly.
