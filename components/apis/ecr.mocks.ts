import { rest } from 'msw'

import config from '../../config'
const url = config.ecr

const data = {
  'name': 'avian-diversity',
  'namespace': 'zelda',
  'owner_id': 'zelda',
  'versions': [{
    'arguments': '',
    'authors': 'author name <author@email.com>',
    'baseCommand': '',
    'collaborators': 'First Last',
    'depends_on': '',
    'description': 'Records environmental sounds, identifies birds by such sounds and finally publishes the results',
    'frozen': false,
    'funding': 'NSF 1935984 https://www.nsf.gov/awardsearch/showAward?AWD_ID=1935984',
    'homepage': 'https://github.com/zelda/BirdNET_Plugin/blob/master/README.md',
    'id': 'zelda/avian-diversity:0.0.2',
    'images': [
      'zelda/avian-diversity/0.0.2/ecr-science-image.jpg'
    ],
    'inputs': [],
    'keywords': 'microhpone, sounds, birds classification, avian diversity',
    'license': 'Creative commons license',
    'metadata': {},
    'name': 'avian-diversity',
    'namespace': 'zelda',
    'owner': 'zelda',
    'science_description': 'zelda/avian-diversity/0.0.2/ecr-science-description.md',
    'source': {
      'architectures': [
        'linux/arm64'
      ],
      'branch': 'main',
      'build_args': {},
      'directory': '.',
      'dockerfile': 'Dockerfile',
      'git_commit': 'e3f1bd87d6bd490e0abc660687256f40711977fb',
      'tag': '',
      'url': 'https://github.com/zelda/BirdNET_Plugin'
    },
    'thumbnail': 'zelda/avian-diversity/0.0.2/ecr-icon.jpg',
    'time_created': '2021-12-16T12:46:36Z',
    'time_last_updated': '2021-12-16T12:46:36Z',
    'version': '0.0.2'
  }, {
    'name': 'avian-diversity',
    'namespace': 'zelda',
    'version': '0.0.3-test',
    'arguments': '',
    'authors': 'author name <author@email.com>',
    'baseCommand': '',
    'thumbnail': 'zelda/avian-diversity/0.0.2/ecr-icon.jpg',
    'time_created': '2021-12-16T12:46:36Z',
    'time_last_updated': '2021-12-16T12:46:36Z'
  }]
}


const md = `
  ## Science

  This is my science.
`


const tags = {
  'arguments': '',
  'baseCommand': '',
  'depends_on': '',
  'description': 'Records environmental sounds, identifies birds by such sounds and finally publishes the results',
  'inputs': [],
  'metadata': {},
  'name': 'avian-diversity',
  'namespace': 'zelda',
  'source': {
    'architectures': [
      'linux/arm64'
    ],
    'branch': 'main',
    'build_args': {},
    'directory': '.',
    'dockerfile': 'Dockerfile',
    'git_commit': 'e3f1bd87d6bd490e0abc660687256f40711977fb',
    'tag': '',
    'url': 'https://github.com/zelda/BirdNET_Plugin'
  },
  'version': '0.0.2'
}


export const handlers = [
  rest.get(`${url}/repositories/${data.namespace}/${data.name}`, (req, res, ctx) =>
    res(ctx.json(data))
  ),
  // mock latest markdown fetch
  rest.get(`${url}/meta-files/${data.versions[0].science_description}`, (req, res, ctx) =>
    res(ctx.text(md))
  ),
  rest.get(`${url}/apps/${data.namespace}/${data.name}/0.0.2`, (req, res, ctx) =>
    res(ctx.json(tags))
  )
]

export {data, url}
