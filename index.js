var fs = require('fs');
var path = require('path');
var vow = require('vow');
var _ = require('lodash');

/**
 * Параметры для конструктора парсера
 * @typedef {object} Parser~params
 * @property {string} baseDir — корень проекта: где лежать папки с блоками и bemjson
 * @property {string} src - входой bemjson
 * @property {array} levels - уровни переопределения
 */

/**
 * Конструктор парсера
 * @class Parser
 * @param {Parser~params} params
 */
var Parser = function(params) {
    this.baseDir = params.baseDir;
    this.src = params.src;
    this.levels = params.levels;
};

/**
 * Реализует всю логику:
 * - разбирает bemjson на список блоков
 * - собираем список папок и цсс-файлов блоков
 * @return {Promise}
 */
Parser.prototype.getFileNames = function() {
    return new vow.Promise(function(resolve, reject) {
        var blocks = [];

        this._getBemjson().forEach(function(ctx) {
            this._getBlockFromCtx(ctx, blocks);
        }, this);

        var blocks = _.uniq(blocks);

        var blockDirs = this._getBlocksDirFromLevels(blocks)
        var cssFiles = this._getCssFiles(blocks);

        resolve({ css: cssFiles, dirs: blockDirs });

    }.bind(this));
};

/**
 * Читает bemjson из файлика, приводит к plain-объекту
 * @return {object|array}
 */
Parser.prototype._getBemjson = function() {
    var file = path.join(this.baseDir, this.src);
    var bemjson = fs.readFileSync(file, 'utf8');

    return new Function('return ' + bemjson)();
};

/**
 * Достает список блоков из bemjson
 * @param  {object|array} ctx - bemjson
 * @param  {array} storage - хранилище списка: вызывая рекурсивно этот метод, передаем хранилище по ссылке
 * @return {array}
 */
Parser.prototype._getBlockFromCtx = function(ctx, storage) {
    if (ctx === undefined || typeof ctx === 'string') {
        return;
    }

    if (Array.isArray(ctx)) {
        ctx.forEach(function(ctx) {
            this._getBlockFromCtx(ctx, storage);
        }, this);
    } else {
        ctx.block && storage.push(ctx.block);
        this._getBlockFromCtx(ctx.content, storage);
    }
};

/**
 * Возвращает список папок блоков со всех уровней переопределения
 * @param  {array} blocks список блоков
 * @return {array}
 */
Parser.prototype._getBlocksDirFromLevels = function(blocks) {
    var dirs = [];

    blocks.forEach(function(block) {
        this.levels.forEach(function(level) {
            var dir = path.join(this.baseDir, level, block);

            try {
                fs.statSync(dir);
                dirs.push(dir);
            } catch(e) {}
        }, this);
    }, this);

    return dirs;
};

/**
 * Возвращает список цсс-файлов блоков со всех уровней переопределения
 * @return {array}
 */
Parser.prototype._getCssFiles = function(blocks) {
    var cssFiles = [];

    this._getBlocksDirFromLevels(blocks).forEach(function(dir) {
        var file = path.join(dir, dir.split('/').pop() + '.css');
        try {
            fs.statSync(file);
            cssFiles.push(file);
        } catch(e) {}
    }, this);

    return cssFiles;
}

module.exports = {
    getFileNames: function(params) {
        var parser = new Parser({
            baseDir: process.cwd(),
            src: params.bemjsonSrc,
            levels: params.levels
        });

        return parser.getFileNames();
    }
}
