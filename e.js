function request_public_answers(callback) {
    wt_async_request_array_of_lines('results/public', 'PUBLIC', function(a) {
          // sort any newly added public results
      var n = answers.length;
      add_answer_array(a);
      var added = answers.splice(n);
      Array.prototype.push.apply(answers, added.sort(function(a, b) { return a.name.localeCompare(b.name); }));
      if (callback)
        callback();
    });
  }

