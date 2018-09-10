const turndown = require('turndown');
const markdown2confluence = require("markdown2confluence");
const turndownService = new turndown();

turndownService.addRule('list', {
  filter: ['ul', 'ol'],

  replacement: function (content, node) {
    var parent = node.parentNode
    if (parent.nodeName === 'LI' && parent.lastElementChild === node) {
      return '\n' + content;
    }
    else if (parent.nodeName === 'OL' || parent.nodeNae === 'UL') {
      return '\n' + content;
    }else {
      return '\n\n' + content + '\n\n';
    }
  }
});

class HtmlConverter{
  constructor(html) {
    this._html = html;
    this._markdown = null;
    this._jiraWiki = null;
  }

  get html() {
    return this._html;
  }

  get markdown() {
    if (!this._markdown) {
      this._markdown = turndownService.turndown(this.html);
    }
    return this._markdown;
  }

  get jiraWiki() {
    if (!this._jiraWiki) {
      this._jiraWiki = markdown2confluence(this.markdown).replace(/\n/g, " \\");
    }
    return this._jiraWiki;
  }
}

module.exports = HtmlConverter;
