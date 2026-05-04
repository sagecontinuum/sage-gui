const models = [
  {
    'name': 'gemma4',
    'sizes': ['e2b', 'e4b', '26b'],
    'recommended': ['e2b', 'e4b'],
    'sageRecommended': ['e2b', 'e4b'],
    'notes': 'Multimodal. E2B/E4B run well on Thor. 26B runs with heavy quantization.'
  },
  {
    'name': 'qwen2-vl',
    'sizes': ['2b', '7b'],
    'recommended': ['2b', '7b'],
    'notes': 'Very efficient VLM. 7B runs smoothly on Thor with quantization.'
  },
  {
    'name': 'qwen3-vl',
    'sizes': ['2b', '4b'],
    'recommended': ['2b', '4b'],
    'sageRecommended': ['2b', '4b']
  },
  {
    'name': 'ministral-3',
    'sizes': ['3b', '8b'],
    'recommended': ['3b', '8b'],
    'notes': 'Multimodal. 8B runs well on Thor with Q4_K_M.'
  },
  {
    'name': 'translategemma',
    'sizes': ['4b', '12b'],
    'recommended': ['4b'],
    'notes': 'Vision-enabled translation model. 4B is ideal for Thor.'
  },
  {
    'name': 'medgemma',
    'sizes': ['4b'],
    'recommended': ['4b'],
    'notes': 'Medical VLM. Lightweight and runs easily on Thor.'
  },
  {
    'name': 'medgemma1.5',
    'sizes': ['4b'],
    'recommended': ['4b'],
    'notes': 'Updated medical VLM. Very efficient.'
  },
  {
    'name': 'glm-ocr',
    'sizes': ['2b'],
    'recommended': ['2b'],
    'notes': 'OCR-focused VLM. Extremely lightweight.'
  },
  {
    'name': 'deepseek-ocr',
    'sizes': ['3b'],
    'recommended': ['3b'],
    'notes': 'OCR VLM. Runs easily on Thor.'
  },
  /* Not part of ollama:
  {
    "name": "Cosmos-Reason2-2B",
    "format": "FP8",
    "source": "NVIDIA NGC",
    "optimized_for": "Jetson AGX Thor",
    "notes": "Officially demonstrated running on Thor for real-time VLM perception."
  },
  {
    "name": "Cosmos-Reason2-8B",
    "format": "FP8",
    "source": "NVIDIA Jetson AI Lab",
    "optimized_for": "Jetson AGX Thor",
    "notes": "Used in Jetson AI Lab vLLM examples; runs with FP8 static KV cache."
  },
  {
    "name": "Qwen3.5-9B",
    "format": "NVFP4",
    "source": "NVIDIA Jetson AI Lab",
    "optimized_for": "Jetson AGX Thor",
    "notes": "Thor-specific NVFP4 checkpoint; supports vision and tool use."
  }
  */
]

const modelOptions = models.flatMap((model) =>
  model.sizes.map((size) => ({
    value: `${model.name}:${size}`,
    label: `${model.name} (${size})`,
    recommended: model.recommended.includes(size),
    sageRecommended: (model.sageRecommended || []).includes(size)
  }))
)

const sageRecommendedModelOptions = modelOptions.filter((option) => option.sageRecommended)
const experimentalModelOptions = modelOptions


export {models, modelOptions, sageRecommendedModelOptions, experimentalModelOptions}



