# Carbonara

API for [carbon](https://carbon.now.sh/).

## Getting started

Send POST `http://carbonara.now.sh/api/cook` to take an image of code snippet.

## How it works

- Puppeteer visit https://carbon.now.sh.
- Mapping all params in properly URL params.
- Taking a screenshot of editor.

## POST `/api/cook`

**Body** is JSON with next params:

| parameter              | default                  | type    | description                                   |
| ---------------------- | ------------------------ | ------- | --------------------------------------------- |
| `code` (required)      |                          | string  | Code snippet                                  |
| `backgroundColor`      | `rgba(171, 184, 195, 1)` | string  | Background color                              |
| `dropShadow`           | `true`                   | boolean | Turn on/off shadow                            |
| `dropShadowBlurRadius` | `68px`                   | string  | shadow blur radius                            |
| `dropShadowOffsetY`    | `20px`                   | string  | shadow offset y                               |
| `exportSize`           | `2x`                     | string  | resolution of exported image                  |
| `fontFamily`           | `Hack`                   | string  | font family                                   |
| `firstLineNumber`      | 1                        | number  | first line number                             |
| `language`             | `auto`                   | string  | programing language for properly highlighting |
| `lineHeight`           | `133%`                   | string  | line height                                   |
| `lineNumbers`          | `false`                  | boolean | turn on/off line number                       |
| `paddingHorizontal`    | `56px`                   | string  | horizontal padding                            |
| `paddingVertical`      | `56px`                   | string  | vertical padding                              |
| `theme`                | `seti`                   | string  | code theme                                    |
| `watermark`            | `false`                  | boolean | turn on/off watermark                         |
| `widthAdjustment`      | `true`                   | boolean | turn on/off width adjustment                  |
| `windowControls`       | `true`                   | boolean | turn on/off window controls                   |
| `windowTheme`          | `none`                   | string  | window theme                                  |

**Defaults params** are the same as https://carbon.now.sh.

**Response** is an image of a code snippet.

## Easy way to tune image

1. Visit https://carbon.now.sh.
2. Set appearance.
3. Click gear → `misc` → `export config` for downloading JSON with the current setting.
4. Add code property in JSON.
5. Use JSON in `/api/cook` request body.

## Unsupported params

These options exist in exported config but there is not a possibility pass it via URL: `backgroundImage`, `backgroundImageSelection`, `backgroundMode`, `squaredImage`, `hiddenCharacters`, `name`, `loading`, `icon`, `isVisible`.

- [ ] `selectedLines`

## Docker

You can use a docker container that running the server with the same API.

- `docker run -p 3000:3000 -it petersolopov/carbonara` — running `petersolopov/carbonara` container in 3000 port.
- `docker run -p 3000:3000 -it --rm --cap-add=SYS_ADMIN $(docker build -q .)` — building locally container and running in 3000 port.

## Local development

Docker is required. Run development server on 3000 port:

`docker run -v $(pwd):/home/pptruser/app/ -p 3000:3000 -it --rm --cap-add=SYS_ADMIN $(docker build -q .) npm run nodemon`

## LICENSE

MIT.
