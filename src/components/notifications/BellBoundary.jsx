import React from 'react';

/**
 * Keeps a failing notification bell from taking the page with it.
 *
 * This is not hypothetical: a duplicate realtime subscription threw during
 * render, React unmounted the whole tree, and /Messages served an empty
 * document. The underlying bug is fixed, but a bell is decoration next to the
 * page's actual job — it should never be able to do that again.
 *
 * Renders nothing on failure. A missing bell is a small loss; a blank page is
 * a total one.
 */
export default class BellBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // Worth seeing in the console — silence here would hide a real regression.
    console.error('NotificationBell failed; hiding it rather than losing the page.', error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
