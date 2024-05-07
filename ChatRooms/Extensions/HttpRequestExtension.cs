using System.Net.Http.Headers;

namespace ChatRooms.Extensions
{
    public static class HttpRequestExtension
    {
        public static Tuple<uint, uint> GetRangeHeaderRequest(this HttpRequest httpRequest)
        {
            var range = httpRequest.Headers.Range.FirstOrDefault();
            RangeHeaderValue.TryParse(range, out var rangeValue);
            uint startIndex = (uint?)rangeValue?.Ranges?.FirstOrDefault()?.From ?? 0;
            uint endIndex = (uint?)rangeValue?.Ranges?.FirstOrDefault()?.To ?? 0;
            return new Tuple<uint, uint>(startIndex, endIndex);
        }
    }
}
