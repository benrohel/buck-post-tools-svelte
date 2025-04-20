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
  import CodeEditor from '../../components/CodeEditor/CodeEditor.svelte';
  import { Highlight, LineNumbers } from 'svelte-highlight';
  import 'svelte-highlight/styles/atom-one-dark.css';

  import horizonDark from 'svelte-highlight/styles/horizon-dark';
  import { evalES } from '../../lib/utils/bolt';
  import {
    ArrowUpFromLine,
    ChevronDown,
    Braces,
    Code,
    CircleX,
    MessageCircleCode,
    ArrowDownToLine,
  } from 'lucide-svelte';
  import Toggle from '../../components/Toggle/Toggle.svelte';
  import { CodeJar } from '@novacbn/svelte-codejar';
  // import { GptRequest } from '../../api/chat-gpt/chat-gpt';
  export let onClose: Function = () => {};
  export let onApplyCode: Function = () => {};
  export let expression: ExpressionSnippet;
  let isScript: boolean = false;
  const setVariables = () => {
    if (expression.values.Variables) {
      const vars = [...new Set(expression.values.Variables)];
      return vars.map((v) => {
        return { label: v, value: v };
      });
    } else {
      return [];
    }
  };

  $: variables = setVariables();
  let gptMessage = '';

  let codeExpression = () => {
    const reg = new RegExp(/{{|}}/, 'g');
    let formattedCode = expression.values.Expression.replace(reg, '');
    if (variables) {
      variables.forEach((v) => {
        console.log(`${v.label}, ${v.value}`);
        formattedCode = formattedCode.replace(v.label, v.value);
      });
    }
    console.log(formattedCode);
    return formattedCode;
  };

  $: code = codeExpression();

  const handleVariableChange = (e: any) => {
    const currentVariableIndex = variables.findIndex((v) => {
      return v.label === e.label;
    });
    let newVariables = variables;
    newVariables[currentVariableIndex] = e;
    variables = [...newVariables];
    code = codeExpression();
  };

  const handleApplyCode = () => {
    console.log(isScript);
    if (isScript) {
      handleEvalScript();
    } else {
      onApplyCode(code);
    }
  };

  const getPropertyReference = async () => {
    const propString = await evalES(`getSelectedPropertyPath()`, false);
    if (propString) {
      const variableIndex = variables.findIndex((el) => {
        return el.label == 'propertyReference';
      });
      let updatedProperty = variables[variableIndex];
      updatedProperty.value = propString;
      let newVariables = variables;
      newVariables[variableIndex] = updatedProperty;
      variables = newVariables;
      code = codeExpression();
    }
  };

  const handleEvalScript = () => {
    evalES(code, true);
  };

  const handleLoadFromAe = async () => {
    code = await evalES(`getSelectedExpression()`, false);
  };
  const handleOnClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleGptRequest = async () => {
    // const res = await GptRequest(gptMessage);
    // code = res;
  };
</script>

<svelte:head>
  {@html horizonDark}
</svelte:head>

<div id="page-mask" on:click={handleOnClose} />
<div id="topModal">
  <div id="close" on:click={handleOnClose}>
    <CircleX />
  </div>
  <div id="modal-content">
    <h4 style="text-align:center">
      {`${expression.values.Name.toUpperCase()} ${
        isScript ? 'SCRIPT' : 'EXPRESSION'
      }`}
    </h4>
    {#if variables}
      <div id="variables-list">
        {#each variables as variable, id}
          <div id="filter-row">
            <div style="display:flex; gap:8px">
              <label style="padding-left:0px" for="name">{variable.label}</label
              >
              {#if variable.label == 'propertyReference'}
                <div id="fav-icon" on:click={getPropertyReference}>
                  <ChevronDown />
                </div>
              {/if}
            </div>
            <input
              type="text"
              bind:value={variable.value}
              on:change={() => {
                handleVariableChange(variable);
              }}
            />
          </div>
        {/each}
        <div style="display:flex; gap:8px">
          {#if expression.id === 'null'}
            <div
              style="display:flex; gap:8px; align-items:center; flex-direction:row"
            >
              <Braces />
              <Toggle bind:checked={isScript} />
              <Code />
            </div>
            <button on:click={handleLoadFromAe}>
              <ArrowUpFromLine />
            </button>
          {/if}
          <button on:click={handleApplyCode}>
            <ArrowDownToLine />
          </button>
        </div>
      </div>
    {/if}
    <hr />

    <div style="display:flex; flex-direction:row">
      <textarea id="gpt-input" bind:value={gptMessage} />
      <button on:click={handleGptRequest}>
        <MessageCircleCode />
      </button>
    </div>

    <CodeJar
      class="hljs"
      syntax="javascript"
      {highlight}
      value={code}
      withLineNumbers={true}
    />
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  #gpt-input {
    width: 100%;
  }

  #topModal {
    z-index: 999;
    position: fixed;
    top: 40px;
    border-radius: 4px;
    border: 1px solid $dimmed-font-color;
    bottom: 0;
    width: 100vw;
    background: $darker;
    display: flex;
    padding-top: 40px;
    align-items: flex-start;
    justify-content: center;
  }

  #close {
    width: 20px;
    height: 20px;
    position: absolute;
    top: 9px;
    right: 9px;
    cursor: pointer;
    fill: #f44;
    transition: transform 0.3s;
    display: flex;
  }

  #close:hover {
    transform: scale(1.2);
  }

  #modal-content {
    width: 100%;
    max-width: calc(100vw - 20px);
    max-height: calc(100vh - 20px);
    overflow: auto;
  }

  #page-mask {
    background: $darker;
    position: fixed;
    /* top: 0; */
    right: 0;
    /* bottom: 0; */
    left: 0;
    height: 100vh;
    z-index: 998;
  }
  #variables-list {
    width: 90%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
    align-items: flex-end;
  }
  #filter-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
  label {
    color: #777777;
  }

  .code-block {
    font-size: medium;
    width: 100%;
    overflow: scroll;
  }
  h4 {
    margin: 0px;
    font-size: 12px;
    color: $font;
  }

  #fav-icon {
    width: 18px;
    height: 18px;
  }
  #fav-icon:hover {
    cursor: pointer;
    filter: brightness(1.25);
  }
</style>
