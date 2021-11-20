const fs = require('fs')
const path = require('path')
let request = require('request')
const qs = require('querystring')
const chalk = require('chalk')
const Spinnies = require('spinnies')
const appDirectory = process.cwd()
let downloadPath = path.resolve(appDirectory, './font')

let options = null

try {
  options = require(path.join(appDirectory, './icon.config.js')) || {}
} catch (e) {
  options = {}
}

const defOptions = {
  fileName: 'iconfont.css',
  dest: downloadPath,
  url: ''
}

function mkdirsSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname);
      return true;
    }
  }
}
/**
 * @desc 下载iconfont 图标
 * @param { String } url iconfont中提供的项目在线链接，注意是 font class中的.css结尾的链接哦
 * @param { String } fileName 目标文件名
 */
function downloadIconfont (options) {
  let mergeOptions = {...defOptions, ...options}
  let { url, dest, fileName } = mergeOptions
  // 得到路径
  dest = path.resolve(dest)
  if (!fs.existsSync(dest)) {
    mkdirsSync(dest)
  }
  let fileUrlArr = []
  return new Promise((resolve, reject) => {
    request(url, function (err, response, body) {
      if (!err && response.statusCode == 200) {
        // 正则匹配出所有的字体url引用地址
        fileUrlArr = body.match(/url\('(\/\/at.alicdn.com[\s\S]+?)[)]/ig)
        // = /url[(]([\s\S]+?)[)]/ig
        // 将url中引用的地址都下载至iconfont存储目录
        fileUrlArr.forEach(url => {
          let downloadUrl = 'https:' + url.substring(5, url.length - 2)
          downloadFile({
            fileUrl: downloadUrl,
            destPath: dest,
            fileName: getPathName(fileName) + getPathExt(downloadUrl.split('?')[0]),
          })
        })
        // 将css文件中的url请求地址，替换为本地地址
        let pathName = getPathName(url)
        let urlParren = new RegExp(`\\/\\/at.alicdn.com\\/t\\/${pathName}`, 'ig')
        body = body.replace(urlParren, getPathName(fileName))
        fs.writeFileSync(path.resolve(dest, './' + fileName), body)
        resolve(true)
      } else {
        reject(false)
      }
    })
  })
}
/**
 * @desc 下载指定路径的文件到本地目标路径
 * @param { Object }
 * fileName 文件名
 * fileUrl 文件下载地址
 * destPath 文件目标路径
 */
function downloadFile ({ fileName, fileUrl, destPath }) {
  let stream = fs.createWriteStream(path.resolve(destPath, `./${fileName}`));
  request(fileUrl).pipe(stream).on("close", function (err) {
    console.log(chalk['blue']("file [" + fileName + "] downloaded"));
  });
}

/**
 * @desc 获取无后缀名的文件名
 * @param { String } url 下载链接 示例 https://at.alicdn.com/t/font_313726_0uhevtktz4ld.css
 * @return { String } name font_313726_0uhevtktz4ld
 */
function getPathName(url) {
  return path.parse(url).name
}

/**
 * @desc 获取后缀名
 * @param { String } url 下载链接 示例 https://at.alicdn.com/t/font_313726_0uhevtktz4ld.eot
 */
function getPathExt(url) {
  return path.parse(url).ext
}

function updateIconfontUrl (options) {
  const {cookie, pid, ctoken} = options
  const formData = qs.stringify({
    pid,
    t: Date.now(),
    ctoken
  })
  const uri = 'https://www.iconfont.cn/api/project/cdn.json'
  return new Promise((resolve, reject) => {
    request({
      uri,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'cookie': cookie
      },
      body: formData
    }, function(err, response) {
      if (!err && response.statusCode == 200) {
        resolve(true)
      } else {
        reject('请求出错。')
      }
    })
  })
}

function getIconfontDetail (options) {
  const {ctoken = '', pid, cookie} = options
  const url = `https://www.iconfont.cn/api/project/detail.json?pid=${pid}&t=${Date.now()}&ctoken=${ctoken}`
  return new Promise((resolve, reject) => {
    request({
      url,
      headers: {
        'cookie': cookie
      }
    }, function(err, response) {
      if (!err && response.statusCode == 200) {
        try {
          const data = JSON.parse(response.body).data || {}
          const cssUrl = 'https:' + data.font['css_file']
          resolve(cssUrl)
        } catch (e) {
          reject(e)
        }
      } else {
        reject('请求出错。')
      }
    })
  })
}

async function main (options) {
  const spinners = new Spinnies({ color: 'blue' })
  function handleSuccess(name, text) {
    spinners.succeed(name, { text })
  }
  function handleFail(name, text) {
    spinners.fail(name, { text})
  }
  try {
    spinners.add('updateCssUrl', { text: '更新iconfont链接' })
    await updateIconfontUrl(options)
    handleSuccess('updateCssUrl', '更新iconfont链接成功!')
  } catch (_) {
    handleFail('updateCssUrl', '更新出错。')
  }
  try {
    spinners.add('downloadIconfont', { text: '开始下载font文件' })
    const cssUrl = await getIconfontDetail(options)
    const downloadOpts = {...options, url: cssUrl}
    await downloadIconfont(downloadOpts)
    handleSuccess('downloadIconfont', '下载完成！')
    console.log(chalk['blue'](`存放路径为${options.dest}`))
  } catch (_) {
    handleFail('downloadIconfont', '文件下载失败。')
  }
}

(async function() {
  await main(options)
})()
