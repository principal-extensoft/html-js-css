using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Text;
using XF.Common;

namespace XF.Common
{

    public static class ParametersQueryExtensions
    {
        /// <summary>
        /// Attempts to pull a list of T out of the parameters.  
        /// If the entry is already a List&lt;T&gt;, it’s returned directly;  
        /// if it’s a single T, it’s wrapped in a new List&lt;T&gt;.  
        /// Always returns a non-null List&lt;T&gt;, empty if nothing found.
        /// </summary>
        public static bool TryGetList<T>(this IParameters parameters, string key, out List<T> list)
        {
            list = new List<T>();

            // 1. If someone stored a List<T>
            if (parameters.TryGet<List<T>>(key, out var existingList)
                || parameters.TryGet<List<T>>(key.ToLower(), out existingList))
            {
                list = existingList ?? new List<T>();
                return list.Count > 0;
            }

            // 2. If they passed a single T
            if (parameters.TryGet<T>(key, out var single)
                || parameters.TryGet<T>(key.ToLower(), out single))
            {
                // filter out null/whitespace for string-types
                if (single != null && !(single is string s && string.IsNullOrWhiteSpace(s)))
                {
                    list.Add(single);
                    return true;
                }
            }

            // nothing to return
            return false;
        }

        public static void SetupFacetedQuery(
            this IParameters parameters,
            SqlCommand command,
            string selectSql,
            string countSql,
            WhereBuilder builder,
            string orderByClause = null)
        {            
            var sqlBuilder = new StringBuilder();
            sqlBuilder.AppendLine(selectSql);
            bool b = builder.TryBuild(out var whereSql);
            if (b)
            {
                sqlBuilder.AppendLine(whereSql);
            }
                
            bool paged = !string.IsNullOrEmpty(orderByClause)
                ? parameters.TryAddPaging(command, sqlBuilder, null, orderByClause)
                : false;

            if (paged)
            {
                var countBuilder = new StringBuilder();
                countBuilder.AppendLine(countSql);
                if (b)
                {
                    countBuilder.AppendLine(whereSql);
                }
                sqlBuilder.AppendLine(countBuilder.ToString());
            }

            command.CommandType = CommandType.Text;
            command.CommandText = sqlBuilder.ToString();
        }

        public static void SetupFacetedQuery(
            this IParameters parameters,
            SqlCommand command,
            string selectSql,
            string countSql,
            Action<WhereBuilder> configureBuilder,
            string orderByClause = null)
        {
            var builder = new WhereBuilder(command, parameters);
            configureBuilder(builder);
            parameters.SetupFacetedQuery(command, selectSql, countSql, builder, orderByClause);
        }

    }
}
