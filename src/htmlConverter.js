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

// turndownService.addRule('listItem', {
//   filter: 'li',
//
//   replacement: function (content, node, options) {
//     content = content
//       .replace(/^\n+/, '') // remove leading newlines
//       .replace(/\n+$/, '/\n') // replace trailing newlines with just a single one
//       .replace(/\n/gm, '/\n    ') // indent
//       .split('nbsp;').join('');
//
//     var prefix = options.bulletListMarker + '   '
//     var parent = node.parentNode
//     if (parent.nodeName === 'OL') {
//       var start = parent.getAttribute('start')
//       var index = Array.prototype.indexOf.call(parent.children, node)
//       prefix = (start ? Number(start) + index : index + 1) + '.  '
//     }
//     return (
//       prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '')
//     )
//   }
// });

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

      console.log(this._jiraWiki);
    }
    return this._jiraWiki;
  }
}

module.exports = HtmlConverter;
