# Carbonara ![build](https://github.com/petersolopov/carbonara/workflows/build/badge.svg)

API for [carbon](https://carbon.now.sh/).

## Getting started

Send POST `https://carbonara.now.sh/api/cook` to take an image of code snippet.

## How it works

- Puppeteer visit https://carbon.now.sh.
- Mapping all params in properly URL params.
- Taking a screenshot of the editor.

## POST `/api/cook`

**Body** is JSON with next params:

| parameter              | default                    | type    | description                                      |
| ---------------------- | -------------------------- | ------- | ------------------------------------------------ |
| `code` (required)      |                            | string  | Code snippet                                     |
| `backgroundColor`      | `"rgba(171, 184, 195, 1)"` | string  | Hex or rgba color                                |
| `dropShadow`           | `true`                     | boolean | Turn on/off shadow                               |
| `dropShadowBlurRadius` | `"68px"`                   | string  | shadow blur radius                               |
| `dropShadowOffsetY`    | `"20px"`                   | string  | shadow offset y                                  |
| `exportSize`           | `"2x"`                     | string  | resolution of exported image, e.g. `1x`, `3x`    |
| `fontFamily`           | `"Hack"`                   | string  | font family, e.g. `JetBrains Mono`, `Fira Code`. |
| `firstLineNumber`      | `1`                        | number  | first line number                                |
| `language`             | `"auto"`                   | string  | programing language for properly highlighting    |
| `lineHeight`           | `"133%"`                   | string  | line height                                      |
| `lineNumbers`          | `false`                    | boolean | turn on/off line number                          |
| `paddingHorizontal`    | `"56px"`                   | string  | horizontal padding                               |
| `paddingVertical`      | `"56px"`                   | string  | vertical padding                                 |
| `theme`                | `"seti"`                   | string  | code theme                                       |
| `watermark`            | `false`                    | boolean | turn on/off watermark                            |
| `widthAdjustment`      | `true`                     | boolean | turn on/off width adjustment                     |
| `windowControls`       | `true`                     | boolean | turn on/off window controls                      |
| `windowTheme`          | `"none"`                   | string  | window theme                                     |

**Defaults params** are the same as https://carbon.now.sh.

**Response** is an image of a code snippet.

## Example

Creating image and saving to `code.png` in terminal.

```bash
curl https://carbonara.now.sh/api/cook/ \
-X POST \
-H 'Content-Type: application/json' \
-d '{
      "code": "export default const sum = (a, b) => a + b",
      "backgroundColor": "#1F816D"
    }' \
> code.png
```

## Easy way to tune image

1. Visit https://carbon.now.sh.
2. Set appearance.
3. Click gear → `misc` → `export config` for downloading JSON with the current setting.
4. Add code property in JSON.
5. Use JSON in `/api/cook` request body.

## Unsupported params

These options exist in exported config but there is not a possibility pass them via URL: `backgroundImage`, `backgroundImageSelection`, `backgroundMode`, `squaredImage`, `hiddenCharacters`, `name`, `loading`, `icon`, `isVisible`.

## Docker

You can use a docker container that running the server with the same API.

- `docker run -p 3000:3000 -it --cap-add=SYS_ADMIN petersolopov/carbonara` — running `petersolopov/carbonara` container in 3000 port.
- `docker run -p 3000:3000 -it --rm --cap-add=SYS_ADMIN $(docker build -q .)` — building locally container and running in 3000 port.

## Local development

Docker is required.

**Development server**

- `docker run -v $(pwd):/home/pptruser/app/ -p 3000:3000 -it --rm --cap-add=SYS_ADMIN $(docker build -q .) npm run nodemon` — run development server on 3000 port

**Running test**

Build container `docker build -t local/carbonara .` and run test:

- `docker run -it --rm --cap-add=SYS_ADMIN local/carbonara npm test` — run test
- `docker run -v $(pwd):/home/pptruser/app/ -it --rm --cap-add=SYS_ADMIN local/carbonara npm test` — run test with update or add new screenshots

## LICENSE

MIT.
