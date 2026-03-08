/// <reference types="tree-sitter-cli/dsl" />

module.exports = grammar({
  name: 'prmpt',

  extras: $ => [
    /[ \t\f\r]/,
  ],

  conflicts: $ => [
    [$.text_line, $.declaration_line],
    [$.text_line, $.section_header],
  ],

  rules: {
    source_file: $ => repeat(choice(
      $.profile_directive,
      $.description_directive,
      $.section,
      $.conditional_directive,
      $.text_line,
      $.empty_line,
      $.list_item,
    )),

    profile_directive: $ => seq(
      field('keyword', alias('@profile', $.directive_keyword)),
      field('profile', $.identifier),
      $.line_end,
    ),

    description_directive: $ => choice(
      seq(
        field('keyword', alias('@description', $.directive_keyword)),
        field('content', $.inline_text),
        $.line_end,
      ),
      seq(
        field('keyword', alias('@description', $.directive_keyword)),
        $.line_end,
        repeat1(choice($.text_line, $.empty_line, $.list_item, $.placeholder_line)),
        field('end_keyword', alias('@end', $.directive_keyword)),
        $.line_end,
      ),
    ),

    section: $ => seq(
      $.section_header,
      repeat(choice(
        $.declaration_line,
        $.placeholder_line,
        $.conditional_directive,
        $.list_item,
        $.text_line,
        $.empty_line,
      )),
      field('end_keyword', alias('@end', $.directive_keyword)),
      $.line_end,
    ),

    section_header: $ => seq(
      field('keyword', alias('@section', $.directive_keyword)),
      field('name', $.section_name),
      $.line_end,
    ),

    section_name: $ => /[A-Za-z_][A-Za-z0-9_]*/,

    declaration_line: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $.type_name),
      $.line_end,
    ),

    type_name: $ => choice('string', 'number', 'bool', 'percentage'),

    conditional_directive: $ => choice(
      seq(alias('@if', $.directive_keyword), field('condition', $.conditional_expression), $.line_end),
      seq(alias('@else', $.directive_keyword), $.line_end),
      seq(alias('@endif', $.directive_keyword), $.line_end),
    ),

    conditional_expression: $ => choice(
      $.logical_expression,
      $.comparison_expression,
      $.percent_helper_expression,
      $.identifier,
      $.number,
      $.boolean,
      $.parenthesized_expression,
    ),

    parenthesized_expression: $ => seq('(', $.conditional_expression, ')'),

    logical_expression: $ => prec.left(1, seq(
      $.conditional_expression,
      field('operator', choice('and', 'or')),
      $.conditional_expression,
    )),

    comparison_expression: $ => prec.left(2, seq(
      $.conditional_expression,
      field('operator', choice('==', '!=', '>=', '<=', '>', '<')),
      $.conditional_expression,
    )),

    percent_helper_expression: $ => seq(
      'pct',
      '(',
      field('argument', $.identifier),
      ')',
      optional(seq(choice('>', '<', '>=', '<=', '==', '!='), $.percentage_literal)),
    ),

    percentage_literal: $ => seq($.number, '%'),

    placeholder_line: $ => seq(repeat1(choice($.placeholder, $.text_segment)), $.line_end),

    placeholder: $ => seq('{{', field('name', $.identifier), '}}'),

    list_item: $ => seq(
      choice($.numbered_marker, $.bullet_marker),
      field('content', optional($.inline_text)),
      $.line_end,
    ),

    numbered_marker: $ => token(seq(/[0-9]+/, '.')),
    bullet_marker: $ => token(choice('-', '*')),

    inline_text: $ => repeat1(choice($.placeholder, $.text_segment)),

    text_line: $ => seq(repeat1(choice($.placeholder, $.text_segment)), $.line_end),

    text_segment: $ => token(/[^
@:{}()[\]]+/),

    empty_line: $ => $.line_end,

    identifier: $ => /[A-Za-z_][A-Za-z0-9_]*/,
    number: $ => /[0-9]+(?:\.[0-9]+)?/,
    boolean: $ => choice('true', 'false'),

    line_end: $ => '\n',
  },
});
