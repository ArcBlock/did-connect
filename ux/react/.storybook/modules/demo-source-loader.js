const path = require('path');
const fs = require('fs');
const replaceAsync = require('./string-replace-async');

const REGEX_IMPORT_STATEMENT = /(import(?:["'\s]*(?:[\w*{}\n\r\t, ]+)from\s*)?["']\s*)([\\./@\w_-]+)(["']\s*;$)/gm;
// 匹配相对路径, 按照约定, 每个组件模块同级会有一个 demo 目录, demos 都存在于该目录中, 所以仅考虑 `..` 前缀的情况
const REGEX_RELATIVE_IMPORT_PATH = /^\.\./;
const REGEX_INDEX_MODULE = /\/index(\.[jt]sx?)?$/;
const PACKAGE_NAME = '@did-connect/react';

const relativePathToAbsolutePath = (demoPath, relativeImportPath, resolvedImportPath, loaderContext) => {
  const packageSrcDir = path.resolve(loaderContext.rootContext, 'src');
  // ".../react/src/Button/index.tsx" => "@did-connect/react/Button/index.tsx"
  const result = resolvedImportPath.replace(packageSrcDir, PACKAGE_NAME);
  // 去除末尾的 "index.tsx" : "@did-connect/react/Button/index.tsx" => "@did-connect/react/Button"
  if (REGEX_INDEX_MODULE.test(result)) {
    return path.dirname(result);
  }
  return result;
};

const resolve = (context, request, loaderContext) => {
  return new Promise((resolve, reject) => {
    loaderContext.resolve(context, request, (err, resolvedPath) => {
      if (err) {
        reject(err);
      } else {
        resolve(resolvedPath);
      }
    })
  });
}

// 处理 demo 模块中 import path (仅处理 '..' 开头的相对路径)
const processImportPath = async (content, resourcePath, loaderContext) => {
  return replaceAsync(content, REGEX_IMPORT_STATEMENT, async (match, p1, p2, p3) => {
    try {
      if (REGEX_RELATIVE_IMPORT_PATH.test(p2)) {
        const resolvedImportPath = await resolve(loaderContext.context, p2, loaderContext);
        return p1 + relativePathToAbsolutePath(resourcePath, p2, resolvedImportPath, loaderContext) + p3;
      }
      return match;
    } catch (e) {
      console.error(e)
      return match;
    }
  });
};

/**
 * 包裹 demo 模块
 * - 将读取的 demo 源码设置到 Story.parameters.storySource.source
 * - 如果 *.stories.js 模块引用 demo 模块后又为其设置 parameters, 保证上一步设置的 Story.parameters.storySource.source 不丢失 (主动覆盖除外)
 *
 * @param {string} requestString demo 模块的引入路径
 * @param {string} rawSource demo 模块源码
 * @returns 包裹后的模块
 */
const wrapModule = (requestString, rawSource) => `
module.exports = require(${requestString});
const _module = module.exports.default || module.exports;
let storyParameters = {
  storySource: { source: ${JSON.stringify(rawSource)} },
  docs: { source: { type: 'code' } },
};
Object.defineProperty(_module, 'parameters', {
  enumerable : true,
  configurable : true,
  get() { return storyParameters; },
  set(value) {
    storyParameters = Object.assign(storyParameters, value);
  },
})
`;

async function pitch(remainingRequest) {
  const callback = this.async();
  this.addDependency(this.resourcePath);
  try {
    const rawSource = await fs.promises.readFile(this.resourcePath, { encoding: 'utf8' });
    const requestString = JSON.stringify(
      this.utils.contextify(this.context || this.rootContext, `!!${remainingRequest}`)
    );
    const precessed = await processImportPath(rawSource, this.resourcePath, this);
    const wrappedModule = wrapModule(requestString, precessed);
    callback(null, wrappedModule);
  } catch (e) {
    callback(e);
  }
}

module.exports = function loader() {};
module.exports.pitch = pitch;
