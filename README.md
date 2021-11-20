# pull-iconfont
一键拉取iocnfont文件到本地

## install

```shell
npm isntall @rainbow_deer/pull-iconfont -D
// or
yarn add @rainbow_deer/pull-iconfont -D
```

## Usage

### Create a new icon.config.js in the root directory
```js
const path = require('path')
module.exports = {
  ctoken: '*', // iconfont token
  dest: path.join(__dirname, './resources/browser/iconfont'), //Storage path
  fileName: 'font.css', // file name
  pid: '1334360', // project id
  cookie: '*'
}
```
```shell
pull-iconfont
```


