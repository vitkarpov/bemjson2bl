# Bemjson2bl

Аналогично [html2bl](https://github.com/dab/html2bl) вытаскивает список блоков из bemjson, с учетом уровней переопределения.


```js
var params = {
    levels: ['common.blocks', 'project.blocks'],
    bemjsonSrc: 'index.bemjson'
};
var getFileNames = require('bemjson2bl').getFileNames(params);

getFileNames.then(function(result) {
    // folders list
    result.dirs

    // css files list
    result.css
})
```
