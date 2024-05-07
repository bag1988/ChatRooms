using System.Net;

namespace ChatRooms
{

    public class AllowedIpForExtensionsEndpointFilter : IEndpointFilter
    {
        public ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
        {
            try
            {
                Console.WriteLine(context.HttpContext.Request.Path);
            }
            finally
            {

            }
            return next(context);
            //return new(Results.StatusCode((int)HttpStatusCode.Forbidden));
        }
    }
}
