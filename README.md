# Carbonara ![build](https://github.com/petersolopov/carbonara/workflows/build/badge.svg)

API for [carbon](https://carbon.now.sh/).

## Getting started

Send POST `https://carbonara.solopov.dev/api/cook` to take an image of code snippet.

## How it works

- Puppeteer visit https://carbon.now.sh.
- Mapping all params in properly URL params.
- Taking a screenshot of the editor.

## POST `/api/cook`

**Body** is JSON or multipart with next params:

| parameter              | default                    | type                      | description                                                                                                                                                             |
| ---------------------- | -------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code` (required)      |                            | string                    | code snippet                                                                                                                                                            |
| `backgroundColor`      | `"rgba(171, 184, 195, 1)"` | string                    | hex or rgba color                                                                                                                                                       |
| `dropShadow`           | `true`                     | boolean                   | turn on/off shadow                                                                                                                                                      |
| `dropShadowBlurRadius` | `"68px"`                   | string                    | shadow blur radius                                                                                                                                                      |
| `dropShadowOffsetY`    | `"20px"`                   | string                    | shadow offset y                                                                                                                                                         |
| `exportSize`           | `"2x"`                     | string                    | resolution of exported image, e.g. `1x`, `3x`                                                                                                                           |
| `fontCustom`           | `""`                       | string                    | custom woff font's contents, encoded in base64                                                                                                                          |
| `fontSize`             | `"14px"`                   | string                    | font size                                                                                                                                                               |
| `fontFamily`           | `"Hack"`                   | string                    | font family, e.g. `JetBrains Mono`, `Fira Code`. See all names in carbon <a href="#easy-way-to-tune-image">exported config</a>.                                         |
| `firstLineNumber`      | `1`                        | number                    | first line number                                                                                                                                                       |
| `language`             | `"auto"`                   | string                    | programing language for properly highlighting. See name in carbon <a href="#easy-way-to-tune-image">exported config</a>. For example bash is named `"application/x-sh"` |
| `lineHeight`           | `"133%"`                   | string                    | line height                                                                                                                                                             |
| `lineNumbers`          | `false`                    | boolean                   | turn on/off line number                                                                                                                                                 |
| `paddingHorizontal`    | `"56px"`                   | string                    | horizontal padding                                                                                                                                                      |
| `paddingVertical`      | `"56px"`                   | string                    | vertical padding                                                                                                                                                        |
| `prettify`             | `false`                    | boolean                   | prettify code with prettier. It works with javascript snippets only, like in carbon.                                                                                    |
| `selectedLines`        | `""`                       | string                    | selected lines to highlight. e.g. `3`, `3,4`, `3,6,8`                                                                                                                   |
| `theme`                | `"seti"`                   | string                    | code theme                                                                                                                                                              |
| `watermark`            | `false`                    | boolean                   | turn on/off watermark                                                                                                                                                   |
| `width`                | `536`                      | number                    | specify the width of the screenshot                                                                                                                                     |
| `widthAdjustment`      | `true`                     | boolean                   | turn on/off width adjustment                                                                                                                                            |
| `windowControls`       | `true`                     | boolean                   | turn on/off window controls                                                                                                                                             |
| `windowTheme`          | `"none"`                   | `"none"` `"sharp"` `"bw"` | window theme                                                                                                                                                            |

**Defaults params** are the same as https://carbon.now.sh.

**Response** is an image of a code snippet.

## Example

Creating image and saving to `code.png` in terminal.

```bash
curl -L https://carbonara.solopov.dev/api/cook \
-X POST \
-H 'Content-Type: application/json' \
-d '{
      "code": "export default const sum = (a, b) => a + b",
      "backgroundColor": "#1F816D"
    }' \
> code.png
```

or using multipart

```bash
curl -L https://carbonara.solopov.dev/api/cook \
-X POST \
-H 'Content-Type: multipart/form-data' \
-F code="export default const sum = (a, b) => a + b" \
-F fontCustom=$(base64 < my-custom-font.ttf) \
-F backgroundColor="#1F816D" \
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

## Docker container

Running the server in 3000 port with docker:

```bash
docker run -p 3000:3000 -it petersolopov/carbonara
```

## Running test

```bash
docker build -t local/carbonara .
docker run -it --rm local/carbonara npm test
```

## Development

There are two main files:

- `api/cook.js` — lambda function (deprecated).
- `src/index.js` – nodejs server that running in docker container.

Running development server:

```bash
docker build -t local/carbonara .
docker run -v $(pwd):/home/pptruser/app/ -p 3000:3000 -it --rm local/carbonara npm run nodemon
```

Updating test images:

```bash
docker build -t local/carbonara .
docker run -v $(pwd):/home/pptruser/app/ -it --rm local/carbonara npm test
```

## LICENSE

MIT.
