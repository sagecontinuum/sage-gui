
export const defaultPrompt = 'Describe what you see in detail.'

function getDefaultSpec({
  prompt = defaultPrompt,
  vsn = 'H00F',
  every = '*/5 * * * *',
  model = 'gemma4:e2b',
  camera = 'rtsp://10.31.81.27:554/profile1/media.smp',
  id = '',
}) {
  const taskName = id ? `edgerunner-demo-${id}` : 'edgerunner-demo'
  return (
  `
name: edgerunner-demo
testname: this is just a test
plugins:
- name: ${taskName}
  pluginSpec:
    image: registry.sagecontinuum.org/seanshahkarami/ollama-hello-world:0.6.2
    args:
    - --model
    - ${model}
    - --prompt
    - ${prompt}
    - ${camera}
nodes:
  ${vsn}: null
scienceRules:
- 'schedule(${taskName}): cronjob("${taskName}", "${every}")'
successCriteria: [] # required param, but ignored
`
  )
}


export default getDefaultSpec