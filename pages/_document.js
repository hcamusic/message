import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';

/**
 * Custom Next `App`
 *
 * https://nextjs.org/docs/#custom-document
 */
export default class MyDocument extends Document {
  /**
   * Handles styled components on the server
   *
   * @param {Object} ctx - nextjs ctx object
   */
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();

    const originalRenderPage = ctx.renderPage;
    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: App => props => sheet.collectStyles(<App {...props} />)
      });

    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      styles: [...initialProps.styles, ...sheet.getStyleElement()]
    };
  }

  /**
   * Sets up base html document
   *
   * @returns {React.Element} Element to render
   */
  render() {
    return (
      <html lang="en" dir="ltr">
        <Head>
          <meta charSet="utf-8" />
          <meta
            name="viewport"
            content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no"
          />
          <meta name="theme-color" content="#ffffff" />

          <link
            href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,600"
            rel="stylesheet"
          />

          <link
            rel="shortcut icon"
            href="https://hcamusic.org/sites/hcamusic.org/files/favicon_1.png"
            type="image/png"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
