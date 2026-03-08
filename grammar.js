module.exports = grammar({
  name: 'prmpt',

  extras: _ => [/[ \t\f\r]/],

  conflicts: $ => [[$.text_line, $.declaration_line]],

  rules: {
    source_file: $ =>
      repeat(
        choice(
          $.profile_directive,
          $.description_directive,
          $.section,
          $.conditional_directive,
          $.list_item,
          $.text_line,
          $.empty_line,
        ),
      ),

    profile_directive: $ =>
      seq(
        field('keyword', alias('@profile', $.directive_keyword)),
        field('profile', $.identifier),
        $.line_end,
      ),

    description_directive: $ =>
      choice(
        seq(
          field('keyword', alias('@description', $.directive_keyword)),
          field('content', $.inline_text),
          $.line_end,
        ),
        seq(
          field('keyword', alias('@description', $.directive_keyword)),
          $.line_end,
          repeat(choice($.list_item, $.text_line, $.empty_line)),
          field('end_keyword', alias('@end', $.directive_keyword)),
          $.line_end,
        ),
      ),

    section: $ =>
      seq(
        $.section_header,
        repeat(
          choice(
            $.declaration_line,
            $.conditional_directive,
            $.list_item,
            $.text_line,
            $.empty_line,
          ),
        ),
        field('end_keyword', alias('@end', $.directive_keyword)),
        $.line_end,
      ),

    section_header: $ =>
      seq(
        field('keyword', alias('@section', $.directive_keyword)),
        field('name', $.section_name),
        $.line_end,
      ),

    section_name: _ => /[A-Za-z_][A-Za-z0-9_]*/,

    declaration_line: $ =>
      prec(
        2,
        seq(
          field('name', $.identifier),
          ':',
          field('type', $.type_name),
          $.line_end,
        ),
      ),

    type_name: _ => choice('string', 'number', 'bool', 'percentage'),

    conditional_directive: $ =>
      choice(
        seq(
          alias('@if', $.directive_keyword),
          field('condition', $.conditional_expression),
          $.line_end,
        ),
        seq(alias('@else', $.directive_keyword), $.line_end),
        seq(alias('@endif', $.directive_keyword), $.line_end),
      ),

    conditional_expression: $ =>
      choice(
        $.comparison_expression,
        $.logical_expression,
        $.percent_helper_expression,
        $.parenthesized_expression,
        $.identifier,
        $.number,
        $.boolean,
      ),

    comparison_expression: $ =>
      seq(
        $.operand,
        field('operator', choice('==', '!=', '>=', '<=', '>', '<')),
        $.operand,
      ),

    logical_expression: $ =>
      seq($.operand, field('operator', choice('and', 'or')), $.operand),

    parenthesized_expression: $ => seq('(', $.conditional_expression, ')'),

    operand: $ =>
      choice(
        $.identifier,
        $.number,
        $.boolean,
        $.percent_helper_expression,
        $.percentage_literal,
        $.parenthesized_expression,
      ),

    percent_helper_expression: $ =>
      seq('pct', '(', field('argument', $.identifier), ')'),

    percentage_literal: $ => seq($.number, '%'),

    list_item: $ =>
      prec(
        1,
        seq(
          choice($.numbered_marker, $.bullet_marker),
          field('content', optional($.inline_text)),
          $.line_end,
        ),
      ),

    numbered_marker: _ => token(seq(/[0-9]+/, '.')),
    bullet_marker: _ => token(choice('-', '*')),

    inline_text: $ => repeat1(choice($.placeholder, $.text_segment)),

    text_line: $ =>
      prec(
        -1,
        seq(repeat1(choice($.placeholder, $.text_segment)), $.line_end),
      ),

    placeholder: $ => seq('{{', field('name', $.identifier), '}}'),

    text_segment: _ => token(/[^:{}@\n\[\]\(\)]+/),

    empty_line: $ => $.line_end,

    identifier: _ => /[A-Za-z_][A-Za-z0-9_-]*/,
    number: _ => /[0-9]+(?:\.[0-9]+)?/,
    boolean: _ => choice('true', 'false'),

    line_end: _ => '\n',
  },
});
