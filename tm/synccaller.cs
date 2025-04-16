
When you need to integrate asynchronous code into a WPF application from a synchronous context, there are a couple of options and best practices to consider:

Convert to Async All the Way (Preferred):
In a WPF app, you can often change your event handlers (for button clicks, etc.) to be asynchronous (i.e. using the async keyword). This lets you use await directly without blocking the UI thread. For example:

private async void OnStartTasksClicked(object sender, RoutedEventArgs e)
{
    // Call the async TaskMaster method with await.
    var (result, stats) = await TaskMaster.ExecuteTasksWithStats<string>(
                                tasks,
                                ProcessResults,
                                CancellationToken.None,
                                logger);
    // Update the UI with the result.
    resultTextBlock.Text = result;
    // Optionally display stats...
}



This approach avoids blocking the UI thread and makes for a smoother experience.

Blocking Synchronously (Use with Caution):
If you’re forced to invoke the asynchronous TaskMaster code from a synchronous context (for example, from code that cannot be marked async), you can block on the asynchronous call. Two common approaches are:


public void RunTasksSynchronously()
{
    // This call will block the calling thread until the task completes.
    var resultTuple = TaskMaster.ExecuteTasksWithStats<string>(
                            tasks,
                            ProcessResults,
                            CancellationToken.None,
                            logger)
                        .GetAwaiter().GetResult();
    
    // Now you can use resultTuple.result and resultTuple.stats
    MessageBox.Show(resultTuple.result);
}

public void RunTasksSynchronously()
{
    var resultTuple = Task.Run(() => 
        TaskMaster.ExecuteTasksWithStats<string>(
             tasks,
             ProcessResults,
             CancellationToken.None,
             logger))
        .Result;
    
    MessageBox.Show(resultTuple.result);
}





A few cautions with synchronous blocking:

Deadlock Risk: Blocking on asynchronous code in a UI thread (or a thread with a synchronization context) can cause deadlocks. One way to help avoid this is to ensure that your asynchronous methods use ConfigureAwait(false) when you don’t need to resume on the UI thread. However, it’s still generally better to “go async” when possible.

UI Responsiveness: Blocking the UI thread will freeze the user interface until the operation completes. For long-running I/O-bound tasks, this is undesirable.

In summary, the recommended approach is to refactor your calling code to be asynchronous so you can use await directly within your WPF event handlers or background tasks. If you must call asynchronously written methods from synchronous code, use blocking constructs like .GetAwaiter().GetResult() or Task.Run(...).Result cautiously, always being aware of the potential for deadlocks and UI freezing.
