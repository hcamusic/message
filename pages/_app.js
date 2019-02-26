import React from 'react';
import App, { Container } from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from 'rimble-ui';

/**
 * Custom Next `App`
 *
 * https://nextjs.org/docs/#custom-app
 */
export default class MyApp extends App {
  /**
   * Renders the app with a default title and wrapped in our theme
   *
   * @returns {React.Element} Element to render
   */
  render() {
    const { Component, pageProps } = this.props;
    return (
      <Container>
        <Head>
          <title>Message | HCA Music</title>
        </Head>
        <ThemeProvider>
          <Component {...pageProps} />
        </ThemeProvider>
      </Container>
    );
  }
}
