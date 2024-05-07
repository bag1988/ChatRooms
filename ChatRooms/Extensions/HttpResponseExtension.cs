using System.Net;


namespace ChatRooms.Extensions
{
    public static class HttpResponseExtension
    {
        public static void SetResponseHeaderSound(this HttpResponse httpResponse, Tuple<uint, uint> rangeHeade)
        {
            httpResponse.Headers.AcceptRanges = $"{"bytes"}";
            if (rangeHeade.Item1 > 0)
                httpResponse.StatusCode = (int)HttpStatusCode.PartialContent;
            httpResponse.ContentType = "video/webm";
            uint endIndex = rangeHeade.Item2;

            httpResponse.Headers.ContentRange = $"{"bytes"} {rangeHeade.Item1}-{endIndex - 1}/*";
        }

    }
}
