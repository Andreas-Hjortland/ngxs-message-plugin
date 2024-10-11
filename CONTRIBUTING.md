# How to contribute

I'm really glad you're reading this. Any contributions are welcome in this project regardless skill level.

## Testing

I strive to have a good test coverage, so please add tests for any new features or bugs to avoid regressions. We are 
using the default Angular test harness, so the tests are written in jasmine and run through karma. Any files with the
extension `.spec.ts` will be run, so if you create a new service or module, just add a corresponding test file with 
tests that covers the functionality.

## Submitting changes

Please send a [GitHub Pull Request](https://github.com/Andreas-Hjortland/ngxs-message-plugin/pull/new/master) with a 
clear list of what you've done (read more about [pull requests](http://help.github.com/pull-requests/)). When you send a
pull request, we will love you forever if you include jasmine tests. We can always use more test coverage. Please follow
the coding style of the project and make sure all of your commits are atomic (one feature per commit).

Always write a clear log message for your commits. One-line messages are fine for small changes, but bigger changes
should look like this:

```bash
$ git commit -m "A brief summary of the commit
> 
> A paragraph describing what changed and its impact."
```

Thanks,
Andreas
