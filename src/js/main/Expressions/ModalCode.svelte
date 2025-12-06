<script context="module" lang="ts">
  // We need to configure highlight.js for Javascript, and then alias the
  // exports to match the function signatures that `CodeJar` Component expects
  import hljs from 'highlight.js/lib/core';
  import javascript from 'highlight.js/lib/languages/javascript';
  import {
    callAnthropicAPI,
    extractCodeFromMarkdown,
  } from '@/api/ai/chat-claude';
  import ChatInput from '@/components/ChatInput/ChatInput.svelte';
  hljs.registerLanguage('javascript', javascript);

  // `highlight` takes the input code and returns the highlighted HTML markup
  const highlight = (code: string, syntax: string) =>
    hljs.highlight(code, {
      language: syntax,
    }).value;
</script>

<script lang="ts">
  import { fs, path } from '@/lib/cep/node';
  import { Circle3 } from 'svelte-loading-spinners';
  import 'svelte-highlight/styles/atom-one-dark.css';
  import { appStore } from '@/stores/app-store';
  import horizonDark from 'svelte-highlight/styles/horizon-dark';
  import { evalES, evalFile, evalTS } from '@/lib/utils/bolt';
  import { ArrowUpFromLine, Braces, Code, CircleX } from 'lucide-svelte';
  import Toggle from '@/components/Toggle/Toggle.svelte';
  import { CodeJar } from '@novacbn/svelte-codejar';
  import { Tooltip } from '@svelte-plugins/tooltips';
  import { localAppStore } from '@/stores/local-storage';
  import { notifications } from '@/stores/notifications-store';
  export let onClose: Function = () => {};
  export let onApplyCode: Function = () => {};
  export let expression: ExpressionSnippet;
  let isScript: boolean = false;
  let isLoading: boolean = false;

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
  $: codeString = '';
  let launchScript: boolean = false;

  const generateRandomString = (length: number = 8): string => {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  };

  let codeExpression = (): string => {
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

  $: code = isScript ? codeString : codeExpression();

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

  $: console.log(codeString);
  const handleEvalScript = async () => {
    const tempFile = path.join(
      __dirname,
      'dist',
      generateRandomString() + '.jsx',
    );
    if (!fs.existsSync(path.dirname(tempFile))) {
      fs.mkdirSync(path.dirname(tempFile));
    }
    fs.writeFileSync(tempFile, code, 'utf-8');
    if (fs.existsSync(tempFile)) {
      await evalFile(tempFile);
      fs.unlinkSync(tempFile);
    }
  };

  const handleLoadFromAe = async () => {
    code = await evalES(`getSelectedExpression()`, false);
  };
  const handleOnClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleChatRequest = async () => {
    console.log('gptMessage', gptMessage);
    if (!$localAppStore.aiService.apiKey) {
      notifications.error('AI Service API key is not set', 2000);
      return;
    } else {
      const res = await callAnthropicAPI(
        gptMessage,
        $localAppStore.aiService.apiKey,
        isScript ? 'scripts' : 'expressions',
      );
      console.log(res);
      if (isScript) {
        codeString = extractCodeFromMarkdown(res);
      } else {
        code = extractCodeFromMarkdown(res);
      }
      isLoading = false;
      if (launchScript) {
        handleEvalScript();
      }
    }
  };

  const handleSaveScript = async () => {
    console.log('handleSaveScript');
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
    <h3 style="text-align:center; color:#1473e6">
      {`${expression.values.Name.toUpperCase()} ${
        isScript ? 'SCRIPT' : 'EXPRESSION'
      }`}
    </h3>
    {#if variables.length > 0}
      <div id="variables-list">
        <div style="text-align:center; margin-bottom:4px; font-size:14px">
          Variables
        </div>
        {#each variables as variable, id}
          <Tooltip
            action={$appStore.showTooltips ? 'hover' : 'none'}
            content="Edit ReferencedVariable"
            position="right"
            delay={1000}
          >
            <div id="filter-row">
              <div style="display:flex; gap:2px">
                <label style="padding-left:0px" for="name"
                  >{variable.label}</label
                >
                {#if variable.label == 'propertyReference'}
                  <div id="fav-icon" on:click={getPropertyReference}>
                    <ArrowUpFromLine />
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
          </Tooltip>
        {/each}
      </div>
    {/if}
    <div style="display:flex; justify-content:flex-end; width:100%">
      {#if expression.id === 'null'}
        <div
          style="display:flex; gap:8px; justify-content:flex-start; width:100%"
        >
          <div
            style="display:flex; gap:8px; align-items:center; flex-direction:row"
          >
            <Tooltip
              action={$appStore.showTooltips ? 'hover' : 'none'}
              content="Edit Expression"
              position="right"
              delay={1000}
            >
              <Braces />
            </Tooltip>
            <Toggle bind:checked={isScript} />
            <Tooltip
              action={$appStore.showTooltips ? 'hover' : 'none'}
              content="Edit Script"
              position="right"
              delay={1000}
            >
              <Code />
            </Tooltip>
          </div>
          <Tooltip
            action={$appStore.showTooltips ? 'hover' : 'none'}
            content="Load Expression from Selected Property"
            position="bottom"
            delay={1000}
          >
            <button class="active" on:click={handleLoadFromAe}>
              <ArrowUpFromLine />
            </button>
          </Tooltip>
        </div>
      {/if}

      <div
        style="display:flex; justify-content:flex-end; width:100%; gap:8px; align-items:center"
      >
        <Toggle bind:checked={launchScript} />
        <Tooltip
          action={$appStore.showTooltips ? 'hover' : 'none'}
          content={isScript
            ? 'Run Script'
            : 'Apply Expression to Selected Property'}
          position="left"
          delay={1000}
        >
          <button class="active" on:click={handleApplyCode}>
            {isScript ? 'Run Script' : 'Apply Expression to Selected Property'}
          </button>
        </Tooltip>
      </div>
    </div>
    <hr />
    <!-- Chat AI-->
    <div style="display:flex; flex-direction:row">
      {#if isLoading}
        <Circle3 size={20} />
      {/if}
      {#if $appStore.devMode === true}
        <ChatInput
          on:submit={() => {
            isLoading = true;
            handleChatRequest();
          }}
          bind:inputValue={gptMessage}
        />
      {/if}
    </div>

    <CodeJar
      class="hljs"
      syntax="javascript"
      {highlight}
      bind:value={code}
      withLineNumbers={true}
      style="overflow: auto;"
    />
    <div id="save-row">
      <Tooltip
        action={$appStore.showTooltips ? 'hover' : 'none'}
        content={isScript
          ? 'Save Script'
          : 'Save Expression to Selected Property'}
        position="left"
        delay={1000}
      >
        <button class="active" on:click={handleSaveScript}>
          {isScript ? 'Save Script' : 'Save Expression'}
        </button>
      </Tooltip>
    </div>
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
    max-height: calc(100vh - 76px);
    background: $darker;
    display: flex;
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
    max-height: calc(100vh - 75px);
    overflow: auto;
  }

  #page-mask {
    background: $darker;
    position: fixed;
    /* top: 0; */
    right: 0;
    /* bottom: 0; */
    left: 0;
    height: calc(100vh - 110px);
    z-index: 998;
  }
  #variables-list {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
    align-items: flex-start;
  }
  #filter-row {
    display: flex;
    flex-direction: row;
    gap: 4px;
    align-items: center;
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

  textarea {
    background-color: $extra-dark;
    border: 1px solid $dimmed-font-color;
    border-radius: 4px;
    color: $font;
  }

  #save-row {
    position: absolute;
    bottom: 8px;
    right: 8px;
  }
</style>
