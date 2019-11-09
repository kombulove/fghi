$(function () {

  function gup(name) {
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(window.location.href);
    return results === null ? "" : decodeURIComponent(results[1]);
  }

  /** Generate a tag in SVG namespace */
  function S(tag, attr) {
    return $(document.createElementNS(
      "http://www.w3.org/2000/svg", tag.replace(/[<>]/g, '')))
      .attr(attr || {});
  }

  $('#toolbar').append('Display up to HSK ');
  [1, 2, 3, 4, 5, 6, 'C', 'all'].forEach(function (level) {
    $('<button>').attr('id', 'btn-' + level).text(level).click(function () {
      $('#wrapper').removeClass().addClass('d' + level);
      $('#toolbar button').removeClass();
      $(this).addClass('selected');
    }).appendTo('#toolbar');
  });
  $('#btn-all').click();

  var currentChar = null;

  function populateData(charData) {
    if (charData.char !== currentChar) return;
    $('#words-pane').empty();
    // char
    var charInfoBox = $('<div class=char-info>').appendTo('#words-pane');
    var svg = $('<svg class=char-img>').attr({
      'width': 256, 'height': 256,
    }).appendTo(charInfoBox);
    var svgOuterGroup = S('g', {
      'transform': 'scale(.25)',
    }).appendTo(svg);
    var svgGroup = S('g', {
      'transform': 'scale(1, -1) translate(0, -900)',
    }).appendTo(svgOuterGroup);
    charData.strokes.forEach(function (d, i) {
      S('path', {'d': d}).appendTo(svgGroup);
    });
    // words
    var wordsList = $('<div class=words-list>').appendTo('#words-pane');
    charData.words.forEach(function (entry) {
      // Simp, Trad, Level, Pron, Gloss
      wordsList.append(
        $('<div>').addClass('h' + entry[2])
          .append($('<span class=level>').text(entry[2]))
          .append(genWordSpan(entry[0]))
          .append($('<span class=pron>').text(entry[3]))
          .append($('<div class=gloss>').text(entry[4]))
      );
    });
  }

  function genWordSpan(word) {
    var span = $('<span class=word>');
    for (var i = 0; i < word.length; i++) {
      $('<span class=wc>').text(word.charAt(i)).appendTo(span);
    }
    return span;
  }

  var charToTd = {};

  function generate(grid_raw, hsk_raw) {
    var charToLevel = {}, commonChars = {};
    [1, 2, 3, 4, 5, 6].forEach(function (level) {
      var levelChars = hsk_raw[level];
      for (var i = 0; i < levelChars.length; i++) {
        charToLevel[levelChars[i]] = level;
      }
    });
    for (var i = 0; i < hsk_raw['C'].length; i++) {
      commonChars[hsk_raw['C'][i]] = true;
    }
    // Create the grid
    var grid = $('<table>').appendTo('#chars-pane');
    grid_raw.forEach(function (row_raw) {
      var row = $('<tr>').appendTo(grid);
      $('<th>').text(row_raw[0]).appendTo(row);
      for (var i = 0; i < row_raw[1].length; i++) {
        var x = row_raw[1].charAt(i);
        charToTd[x] = $('<td>').text(x).appendTo(row);
        if (charToLevel[x] !== undefined)
          charToTd[x].addClass('h' + charToLevel[x]);
        else
          charToTd[x].addClass('hx');
        if (commonChars[x] === undefined)
          charToTd[x].addClass('hC');
      }
    });
    grid.on('click', 'td', function (event) {
      var cell = $(this), char = cell.text(), code = char.charCodeAt(0);
      $('#chars-pane .selected').removeClass('selected');
      cell.addClass('selected');
      currentChar = char;
      $.get('data/vocab/' + code + '.json', populateData);
    });
  }

  $('#words-pane').on('click', '.wc', function () {
    var td = charToTd[$(this).text()];
    if (!td) return;
    $('#chars-pane').animate({ scrollTop: td.position().top });
    td.addClass('flash');
    setTimeout(function () { td.removeClass('flash'); }, 1000);
  });

  var gridName = gup('grid') || 'fghi';
  $.get('data/grid-' + gridName + '.json', function (grid_raw) {
    $.get('data/hsk.json', function (hsk_raw) {
      generate(grid_raw, hsk_raw);
    });
  });

});
