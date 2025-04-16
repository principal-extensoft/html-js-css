using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient; // or use Microsoft.Data.SqlClient if preferred
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace MyNamespace
{
    #region Result Types

    /// <summary>
    /// Common interface for I/O operation results.
    /// </summary>
    public interface IoResult
    {
        bool IsSuccess { get; }
        string ErrorMessage { get; }
    }

    /// <summary>
    /// Strongly typed result for HTTP operations.
    /// </summary>
    public class HttpResult : IoResult
    {
        public bool IsSuccess { get; set; }
        public string ErrorMessage { get; set; }
        public string Content { get; set; }
        public System.Net.HttpStatusCode StatusCode { get; set; }
    }

    /// <summary>
    /// Strongly typed result for SQL operations.
    /// </summary>
    public class SqlResult : IoResult
    {
        public bool IsSuccess { get; set; }
        public string ErrorMessage { get; set; }
        public DataTable Data { get; set; }
    }

    #endregion

    #region Interfaces

    /// <summary>
    /// Non-generic base interface for I/O-bound tasks.
    /// </summary>
    public interface IIoBoundTask
    {
        /// <summary>
        /// A string discriminator that identifies the type of I/O operation.
        /// </summary>
        string Type { get; }

        /// <summary>
        /// Executes the I/O operation asynchronously.
        /// </summary>
        /// <param name="cancellationToken">The cancellation token.</param>
        /// <param name="logger">The logger instance for logging.</param>
        /// <returns>A task yielding an IoResult.</returns>
        Task<IoResult> ExecuteAsync(CancellationToken cancellationToken, ILogger logger);
    }

    /// <summary>
    /// Generic interface for I/O-bound tasks returning a strongly typed result.
    /// </summary>
    /// <typeparam name="T">A type that implements IoResult.</typeparam>
    public interface IIoBoundTask<T> : IIoBoundTask where T : IoResult
    {
        /// <summary>
        /// A string discriminator that identifies the type of I/O operation.
        /// </summary>
        new string Type { get; }

        /// <summary>
        /// Executes the I/O operation asynchronously and returns a strongly typed result.
        /// </summary>
        /// <param name="cancellationToken">The cancellation token.</param>
        /// <param name="logger">The logger instance for logging.</param>
        /// <returns>A task yielding an instance of T.</returns>
        new Task<T> ExecuteAsync(CancellationToken cancellationToken, ILogger logger);
    }

    #endregion

    #region Concrete Task Implementations

    /// <summary>
    /// A concrete I/O-bound task that issues an HTTP call.
    /// </summary>
    public class HttpTask : IIoBoundTask<HttpResult>
    {
        public string Type => "Http";

        public string Url { get; }
        public HttpMethod Method { get; }
        public HttpContent Content { get; }

        private readonly HttpClient _client;

        public HttpTask(HttpClient client, string url, HttpMethod method = null, HttpContent content = null)
        {
            _client = client ?? throw new ArgumentNullException(nameof(client));
            Url = url ?? throw new ArgumentNullException(nameof(url));
            Method = method ?? HttpMethod.Get;
            Content = content;
        }

        public async Task<HttpResult> ExecuteAsync(CancellationToken cancellationToken, ILogger logger)
        {
            var request = new HttpRequestMessage(Method, Url);
            if (Content != null)
            {
                request.Content = Content;
            }

            try
            {
                HttpResponseMessage response = await _client.SendAsync(request, cancellationToken);
                string responseContent = await response.Content.ReadAsStringAsync();
                return new HttpResult
                {
                    StatusCode = response.StatusCode,
                    IsSuccess = response.IsSuccessStatusCode,
                    Content = responseContent,
                    ErrorMessage = response.IsSuccessStatusCode ? null : $"HTTP call failed with status {response.StatusCode}"
                };
            }
            catch (Exception ex)
            {
                logger?.LogError(ex, $"Error during HTTP call to {Url}");
                return new HttpResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        // Explicit implementation for the non-generic interface
        async Task<IoResult> IIoBoundTask.ExecuteAsync(CancellationToken cancellationToken, ILogger logger)
        {
            return await ExecuteAsync(cancellationToken, logger);
        }
    }

    /// <summary>
    /// A concrete I/O-bound task that executes a SQL command and handles a DataReader result.
    /// </summary>
    public class SqlCommandTask : IIoBoundTask<SqlResult>
    {
        public string Type => "Sql";

        public string CommandText { get; }
        public CommandType CommandType { get; }
        public IEnumerable<SqlParameter> Parameters { get; }

        private readonly string _connectionString;

        public SqlCommandTask(string connectionString, string commandText, CommandType commandType = CommandType.Text, IEnumerable<SqlParameter> parameters = null)
        {
            _connectionString = connectionString ?? throw new ArgumentNullException(nameof(connectionString));
            CommandText = commandText ?? throw new ArgumentNullException(nameof(commandText));
            CommandType = commandType;
            Parameters = parameters ?? new List<SqlParameter>();
        }

        public async Task<SqlResult> ExecuteAsync(CancellationToken cancellationToken, ILogger logger)
        {
            var result = new SqlResult();
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync(cancellationToken);
                    using (var command = new SqlCommand(CommandText, connection))
                    {
                        command.CommandType = CommandType;
                        if (Parameters.Any())
                        {
                            command.Parameters.AddRange(Parameters.ToArray());
                        }
                        using (var reader = await command.ExecuteReaderAsync(cancellationToken))
                        {
                            var dataTable = new DataTable();
                            dataTable.Load(reader); // Populate the DataTable with the data from the DataReader
                            result.Data = dataTable;
                            result.IsSuccess = true;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                logger?.LogError(ex, "Error executing SQL command.");
                result.IsSuccess = false;
                result.ErrorMessage = ex.Message;
            }
            return result;
        }

        // Explicit implementation for the non-generic interface
        async Task<IoResult> IIoBoundTask.ExecuteAsync(CancellationToken cancellationToken, ILogger logger)
        {
            return await ExecuteAsync(cancellationToken, logger);
        }
    }

    #endregion
}
