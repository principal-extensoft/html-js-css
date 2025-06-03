        protected override void InitializeIndexCommand(SqlCommand command, IParameters parameters)
        {
            var builder = new WhereBuilder(command, parameters)
                .AddIn<string>("lob", "lob.LineOfBusiness", SqlDbType.NVarChar, 30)
                .AddIn<string>("domain", "p.Domain", SqlDbType.NVarChar, 50)
                .AddIn<int>("year", "p.Year", SqlDbType.Int);

            StringBuilder baseSelect = new();
            StringBuilder from = new();
            StringBuilder baseCount = new();

            baseSelect.Append("SELECT p.[Id], p.[OrigamiId], p.[EntityId], p.[NamedInsured], p.[Domain], p.[PolicyType], p.[PolicyNumber], p.[Effective], p.[Year], p.[Month], p.[Disposition], p.[POCId]");
            baseCount.Append("SELECT COUNT(*)");

            from.Append(" FROM [dashboard].[Policy] p");

            if (builder.KeyExists("lob"))
            {
                from.Append(" JOIN [dashboard].[Premium] lob ON lob.PolicyId = p.Id");
            }

            baseSelect.AppendLine(from.ToString());
            baseCount.AppendLine(from.ToString());

            parameters.SetupFacetedQuery(
                command,
                baseSelect.ToString(),
                baseCount.ToString(),
                builder,
                orderByClause: "p.Effective DESC"
            );
        }
