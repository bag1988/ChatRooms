using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

//builder.Services.AddHttpClient("WebAPI", (service, client) =>
//{
//    client.BaseAddress = new Uri(service.GetRequiredService<IWebAssemblyHostEnvironment>().BaseAddress);    
//});
//builder.Services.AddScoped(sp => sp.GetRequiredService<IHttpClientFactory>().CreateClient("WebAPI"));

await builder.Build().RunAsync();
