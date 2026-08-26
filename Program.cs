var builder =
    WebApplication.CreateBuilder(args);

var app =
    builder.Build();

app.MapGet(
    "/dev-marker.js",
    () =>
    {
#if DEBUG
        const string script = """
            document.addEventListener('DOMContentLoaded', () => {
                const title = document.querySelector('.hero-title');
                if (title) {
                    title.textContent += ' >DEV<';
                }

                document.title += ' >DEV<';
            });
            """;
#else
        const string script = "";
#endif

        return Results.Text(
            script,
            "application/javascript; charset=utf-8");
    });

app.UseDefaultFiles();
app.UseStaticFiles();

app.Run();
