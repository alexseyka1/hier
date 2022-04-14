class App extends Hier.BaseComponent {
  render() {
    return html`<div class="main flex-column home-hero w-100">
      <div class="scrollarea">
        <${Navbar} class="navbar sticky-top d-flex justify-content-center container py-0" />
        <${HashRouter} class="w-100">
          <${HomePage} :route="/" />

          <${PostsPage} :route="/posts" />
          <${PostPage} :route="/post/:id" class="w-100" />

          <${UsersPage} :route="/users" />
          <${UserPage} :route="/user/:id" class="w-100" />
        </HashRouter>
      </div>
    </div>`
  }
}
