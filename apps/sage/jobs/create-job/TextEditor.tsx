import { useState, useEffect, useRef } from 'react'

import { editor, languages, Uri } from 'monaco-editor'
import EditorWorker from 'url:monaco-editor/esm/vs/editor/editor.worker.js'

import * as ECR from '/components/apis/ecr'
import * as BK from '/components/apis/beekeeper'

/* todo(nc): enable (see notes below) */
// import YamlWorker from 'url:monaco-yaml/yaml.worker.js'
// import JSONWorker from 'url:monaco-editor/esm/vs/language/json/json.worker.js'
// import { setDiagnosticsOptions } from 'monaco-yaml'


declare global {
  interface Window {
    MonacoEnvironment: any
  }
}


self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label: String) {
    /* todo(nc): enable (see notes below)
    if (label === 'yaml') {
      return YamlWorker
    } */
    /* we don't need to load workers other languages, but you could as follows
    if (label === 'json') {
      return JSONWorker
    } */
    return EditorWorker
  }
}

// todo(nc): configure sage-yaml
// To do this, we first need to bump monaco-editor to a later version >=0.34
// Unfornately, this is an issue: https://github.com/microsoft/monaco-editor/issues/2966
/*
setDiagnosticsOptions({
  hover: true,
  completion: true,
  validate: true,
  format: true,
  enableSchemaRequest: true,
  schemas: [
    {}
  ]
})
*/


type Props = {
    value: string;
    onChange: (value: string) => void
}

export default function TextEditor(props: Props) {
  const {value, onChange} = props

  const domRef = useRef(null)
  const editorRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  /* todo(nc): list validation errors from sage-yaml
  const handleEditorValidation = (markers) => {
    markers.forEach((marker) => console.log('onValidate:', marker.message))
  } */

  useEffect(() => {
    const model = editor.createModel('', 'yaml', Uri.parse('foo://bar/baz.yaml'))

    editorRef.current = editor.create(domRef.current, {
      model,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      theme: 'vs-dark',
      tabSize: 2,
      quickSuggestions: { other: true, strings: true } // critical for autocomplete (when using yaml)
    })

    editorRef.current.onDidChangeModelContent(() => {
      const value = editorRef.current.getValue()
      onChange(value)
    })

    setLoaded(true)

    return () => {
      editorRef.current.getModel()?.dispose()
    }
  }, [])


  useEffect(() => {
    if (!loaded) return

    const val = editorRef.current.getValue()
    if (value !== val) {
      const op = {
        range: editorRef.current.getModel().getFullModelRange(),
        text: value,
        forceMoveMarkers: true,
      }
      editorRef.current.executeEdits('', [op])
      editorRef.current.pushUndoStop()
    }
  }, [loaded, value])


  return (
    <div ref={domRef} style={{width: '100%', height: '100%'}}></div>
  )
}


export function registerAutoComplete(
  keywords: string[],
  apps: ECR.App[],
  nodes: BK.Manifest[]
) {
  languages.registerCompletionItemProvider('yaml', {
    provideCompletionItems: () => {
      const snippetConfig = {
        kind: languages.CompletionItemKind.Snippet,
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet
      }

      const keywordConfig= {
        kind: languages.CompletionItemKind.Keyword,
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet
      }

      const suggestions = [
        ...keywords.map(word => ({
          label: word,
          insertText: word,
          ...keywordConfig
        })),
        {
          label: 'image',
          insertText: 'image: ${1|' + apps.map(o => `registry.sagecontinuum.org/${o.id}`).join(',') + '|}',
          ...keywordConfig
        },  {
          label: 'node',
          insertText: nodes.length ?
            '${1|' + nodes.map(o => o.vsn).join(',') + '|}: True'
            : 'it seems you can not schedule on any nodes.  please contact us if interested.',
          ...keywordConfig
        }, {
          label: 'science rule > schedule when',
          insertText: '"schedule(\'${1:appName}\'): any(v(\'env.some.var\') >= 1"',
          documentation: `Basic schedule rule\n  ex: "schedule('my-app'): any(v('env.some.var') >= 1"` ,
          ...snippetConfig
        }, {
          label: 'science rule > schedule every (cron)',
          insertText: '"schedule(\'${1:appName}\'): cronjob(\'${1:appName}\', \'* * * * *\')"',
          documentation: `Basic cron rule:\n  ex: "schedule('my-app-name'): cronjob('my-app-name', '* * * * *')"`,
          ...snippetConfig
        }, {
          label: 'science rule > publish',
          insertText: '"publish(\'${1:appName\'}): any(v(\'env.some.var\') >= 1"',
          documentation: `Basic action rule\n  ex: "publish('my-app-name'): any(v('env.temperature') >= 1"`,
          ...snippetConfig
        }, {
          label: 'science rule > set',
          insertText: '"set($1, value=\'$2\'): any(v(\'env.some.var\') >= 1"',
          documentation: 'Basic set rule\n   ex: "set($1, value="$2"): any(v(\'env.temperature\') >= 1"',
          ...snippetConfig
        }, {
          label: 'pluginSpec',
          insertText: [
            'pluginSpec:',
            '  image:',
            '  args:',
            '    - --param1',
            '    - "some_value"',
            '    - --param1',
            '    - "some_value"',
          ].join('\n'),
          documentation: 'Basic spec for a plugin',
          ...snippetConfig
        },
        {
          label: 'plugin',
          insertText: [
            '- name: $1',
            '  pluginSpec:',
            '    image: $2',
            '    args:',
            '      - --param1',
            '      - "some_value"',
            '      - --param1',
            '      - "some_value"',
          ].join('\n'),
          documentation: 'Basic plugin snippet',
          ...snippetConfig
        }
      ]

      return { suggestions }
    }})
}
