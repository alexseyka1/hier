class HomePage extends Hier.Component {
  render() {
    const code = html`<pre class="text-start p-3 rounded glass-bg home__code shadow">
      <div>const { ast: html } = HierParser</div>
      <div class="ps-4">
        class App extends Hier.BaseComponent {
        <div class="ps-4">
          render() {
          <div class="ps-4">return html\` &lt;h1&gt;Hello&lt;/h1&gt; \`</div>
          }
        </div>
        }
      </div>
      <div>Hier.render(App, document.getElementById("app")</div>
    </pre>`

    return html`
      <div class="px-4 py-5 text-center container">
        <h1 class="display-1 fw-bold">
          Hier
          <span class="fa-solid fs-1 fa-wand-sparkles ms-4"></span>
        </h1>
        <div class="col-lg-6 mx-auto">
          <p class="lead mb-4">
            A brand new JavaScript library that parses and renders components written in template literals really fast.
            You don't need any build systems or framework anymore. Get started quickly.
          </p>
          <div class="mb-4">${code}</div>
          <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
            <a href="#posts" class="btn btn-teal btn-lg px-4 gap-3">View posts</a>
            <a href="#users" class="btn btn-outline-secondary btn-lg px-4">Show me users</a>
          </div>
        </div>
      </div>
    `
  }
}
