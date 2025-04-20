<script context="module" lang="ts">
  // We need to configure highlight.js for Javascript, and then alias the
  // exports to match the function signatures that `CodeJar` Component expects
  import hljs from 'highlight.js/lib/core';
  import javascript from 'highlight.js/lib/languages/javascript';

  hljs.registerLanguage('javascript', javascript);

  // `highlight` takes the input code and returns the highlighted HTML markup
  const highlight = (code: string, syntax: string) =>
    hljs.highlight(code, {
      language: syntax,
    }).value;
</script>

<script lang="ts">
  import { CodeJar } from '@novacbn/svelte-codejar';

  let value = `console.log("Hello World!");`;
</script>

<!--
  Now we pass `CodeJar` our syntax highlighting functions along with the
  language syntax used for highlighting

  We also need to pass the `hljs` class so highlight.js knows which element
  to style
-->

<CodeJar class="hljs" syntax="javascript" {highlight} {value} />
