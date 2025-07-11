using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

public class ApplicationInfo
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Url { get; set; }
    public string Stage { get; set; }
}

public class UrlProcessor
{
    private readonly HttpClient _httpClient;

    public UrlProcessor()
    {
        _httpClient = new HttpClient();
    }

    public async Task ProcessUrlsAsync(
        IEnumerable<ApplicationInfo> applications,
        Func<ApplicationInfo, HttpResponseMessage, Task> resultProcessor)
    {
        var tasks = new List<Task>();
        
        foreach (var app in applications)
        {
            if (!string.IsNullOrEmpty(app.Url) && Uri.IsWellFormedUriString(app.Url, UriKind.Absolute))
            {
                tasks.Add(Task.Run(async () =>
                {
                    try
                    {
                        var response = await _httpClient.GetAsync(app.Url);
                        await resultProcessor(app, response);
                    }
                    catch (HttpRequestException ex)
                    {
                        await resultProcessor(app, new HttpResponseMessage
                        {
                            StatusCode = System.Net.HttpStatusCode.ServiceUnavailable,
                            ReasonPhrase = ex.Message
                        });
                    }
                }));
            }
        }

        await Task.WhenAll(tasks);
    }

    // Dispose HttpClient when done
    public void Dispose()
    {
        _httpClient?.Dispose();
    }
}
