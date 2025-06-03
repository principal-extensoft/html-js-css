using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using XF.Common;

namespace XF.Common
{


    /// <summary>
    /// Builds SQL WHERE clauses by capturing predicates, ranges, IN lists, and custom filters with parameterization.
    /// Also provides ability to inspect which keys were present.
    /// </summary>
    /// 

    public class WhereBuilder
    {
        private readonly SqlCommand _command;
        private readonly IParameters _parameters;
        private readonly List<string> _clauses = new List<string>();
        private readonly HashSet<string> _foundKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        private int _paramCounter;

        public WhereBuilder(SqlCommand command, IParameters parameters)
        {
            _command = command ?? throw new ArgumentNullException(nameof(command));
            _parameters = parameters ?? throw new ArgumentNullException(nameof(parameters));
            _paramCounter = 0;
        }

        /// <summary>
        /// Checks whether the specified key (facet) was provided in the parameters.
        /// </summary>
        public bool KeyExists(string key)
            => _foundKeys.Contains(key) || _foundKeys.Contains(key.ToLower());

        /// <summary>
        /// Adds an IN (...) filter for a list or single value of type T.
        /// </summary>
        public WhereBuilder AddIn<T>(string key, string columnName, SqlDbType dbType, int size = 0)
        {
            if (!_parameters.TryGetList<T>(key, out var items) || items.Count == 0)
                return this;

            _foundKeys.Add(key);
            var names = new List<string>(items.Count);
            foreach (var item in items)
            {
                string pName = "@p" + (_paramCounter++);
                names.Add(pName);
                var param = size > 0
                    ? _command.Parameters.Add(pName, dbType, size)
                    : _command.Parameters.Add(pName, dbType);
                param.Value = (object?)item ?? DBNull.Value;
            }

            _clauses.Add($"{columnName} IN ({string.Join(", ", names)})");
            return this;
        }

        /// <summary>
        /// Adds a BETWEEN ... AND ... range filter for two keys.
        /// </summary>
        public WhereBuilder AddRange<T>(string fromKey, string toKey, string columnName, SqlDbType dbType, int size = 0)
        {
            bool hasFrom = _parameters.TryGet<T>(fromKey, out var fromVal) || _parameters.TryGet<T>(fromKey.ToLower(), out fromVal);
            bool hasTo = _parameters.TryGet<T>(toKey, out var toVal) || _parameters.TryGet<T>(toKey.ToLower(), out toVal);
            if (!hasFrom && !hasTo)
                return this;

            _foundKeys.Add(hasFrom ? fromKey : toKey);
            if (hasFrom)
            {
                string pFrom = "@p" + (_paramCounter++);
                var paramFrom = size > 0
                    ? _command.Parameters.Add(pFrom, dbType, size)
                    : _command.Parameters.Add(pFrom, dbType);
                paramFrom.Value = (object?)fromVal! ?? DBNull.Value;

                if (hasTo)
                {
                    string pTo = "@p" + (_paramCounter++);
                    var paramTo = size > 0
                        ? _command.Parameters.Add(pTo, dbType, size)
                        : _command.Parameters.Add(pTo, dbType);
                    paramTo.Value = (object?)toVal! ?? DBNull.Value;
                    _clauses.Add($"{columnName} BETWEEN {pFrom} AND {pTo}");
                }
                else
                {
                    _clauses.Add($"{columnName} >= {pFrom}");
                }
            }
            else
            {
                string pTo = "@p" + (_paramCounter++);
                var paramTo = size > 0
                    ? _command.Parameters.Add(pTo, dbType, size)
                    : _command.Parameters.Add(pTo, dbType);
                paramTo.Value = (object?)toVal! ?? DBNull.Value;
                _clauses.Add($"{columnName} <= {pTo}");
            }
            return this;
        }

        /// <summary>
        /// Adds a custom predicate filter for a single value of type T.
        /// </summary>
        public WhereBuilder AddPredicate<T>(string key, string columnName, SqlDbType dbType,
            Action<SqlParameter, T> setupParam, Func<string, string> formatClause)
        {
            if (!_parameters.TryGet<T>(key, out var value) && !_parameters.TryGet<T>(key.ToLower(), out value))
                return this;

            _foundKeys.Add(key);
            string pName = "@p" + (_paramCounter++);
            var param = _command.Parameters.Add(pName, dbType);
            setupParam(param, value!);

            _clauses.Add(formatClause(pName));
            return this;
        }

        /// <summary>
        /// Adds a subquery-based IN filter:
        ///   mainColumn IN (
        ///     SELECT fkColumn FROM subTable WHERE filterColumn IN (@p0,@p1…)
        ///   )
        /// </summary>
        public WhereBuilder AddInSubQuery<T>(
            string key,
            string mainColumn,
            string subTable,
            string fkColumn,
            string filterColumn,
            SqlDbType dbType,
            int size = 0)
        {
            if (!_parameters.TryGetList<T>(key, out var items) || items.Count == 0)
                return this;

            _foundKeys.Add(key);
            var names = new List<string>(items.Count);
            foreach (var item in items)
            {
                string pName = "@p" + (_paramCounter++);
                names.Add(pName);
                var param = size > 0
                    ? _command.Parameters.Add(pName, dbType, size)
                    : _command.Parameters.Add(pName, dbType);
                param.Value = (object?)item ?? DBNull.Value;
            }

            string inList = string.Join(", ", names);
            string clause = $@"
                {mainColumn} IN (
                    SELECT {fkColumn}
                    FROM {subTable}
                    WHERE {filterColumn} IN ({inList})
                )".Trim();
            _clauses.Add(clause);
            return this;
        }

        /// <summary>
        /// Builds the raw WHERE clause (without the "WHERE " prefix), or null if no filters were added.
        /// </summary>
        public string? Build()
            => _clauses.Count > 0 ? string.Join(" AND ", _clauses) : null;

        /// <summary>
        /// Attempts to build the WHERE clause, including the "WHERE " prefix. Returns true if filters exist.
        /// </summary>
        public bool TryBuild(out string whereClause)
        {
            var raw = Build();
            if (string.IsNullOrEmpty(raw))
            {
                whereClause = string.Empty;
                return false;
            }
            whereClause = "WHERE " + raw;
            return true;
        }
    }

}
