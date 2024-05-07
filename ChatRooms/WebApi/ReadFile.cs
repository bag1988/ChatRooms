using ChatRooms.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Diagnostics;
using System.Net;
using System.Threading.RateLimiting;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace ChatRooms.WebApi
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class ReadFile : ControllerBase
    {
        private readonly ILogger<ReadFile> _logger;

        public ReadFile(ILogger<ReadFile> logger)
        {
            _logger = logger;
        }

        // GET: api/ReadFile/GetVideoStream/<fileName>
        [HttpGet("{fileName}")]
        public Task GetVideoStream(string fileName)
        {
            try
            {
                _logger.LogTrace("Получение файла {name}", fileName);
                fileName = Path.Combine("wwwroot", "tmpvideo", $"{fileName}.webm");
                var range = Request.GetRangeHeaderRequest();

                Response.Headers.AcceptRanges = $"{"bytes"}";


                Response.ContentType = "video/webm";

                if (System.IO.File.Exists(fileName))
                {
                    return GetSoundServer(fileName, range.Item1, range.Item2);
                }
            }
            catch (Exception ex)
            {
                if (ex is not OperationCanceledException)
                    _logger.LogError(ex, Request.RouteValues["action"]?.ToString());
            }
            return Task.CompletedTask;
        }

        async Task GetSoundServer(string fileName, uint startIndex, uint endIndex)
        {
            try
            {
                var outputStream = Response.Body;
                if (outputStream != null)
                {
                    try
                    {
                        byte[] buffer = new byte[32000];
                        int readCount = 0;
                        using (var readFile = new FileStream(fileName, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                        {

                            if (startIndex > 0 && readFile.Length - startIndex <= 0)
                            {
                                await Task.Delay(1000, HttpContext.RequestAborted);
                            }

                            var endRange = endIndex > 0 ? endIndex : readFile.Length;
                            Response.StatusCode = (int)HttpStatusCode.PartialContent;

                          
                            if (endRange > 0)
                            {
                                Response.Headers.ContentRange = $"bytes {startIndex}-{endRange - 1}/{uint.MaxValue}";
                                //Response.ContentLength = endRange - startIndex;
                            }
                            else
                            {
                                Response.Headers.ContentRange = $"bytes {startIndex}-0/*";
                            }


                            if (startIndex > 0)
                            {
                                readFile.Seek(startIndex, SeekOrigin.Begin);
                            }

                            if (readFile.Length > 0)
                            {
                                long total = 0;
                                while ((readCount = await readFile.ReadAsync(buffer, HttpContext.RequestAborted)) != 0)
                                {
                                    if (readCount > 0)
                                    {
                                        if (endIndex > 0 && readFile.Position > endIndex)
                                        {
                                            readCount = (int)(endIndex - total);

                                            if (readCount == 0)
                                            {
                                                break;
                                            }
                                        }
                                        total += readCount;
                                        await outputStream.WriteAsync(buffer.Take(readCount).ToArray(), HttpContext.RequestAborted);
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "ReadSoundFromFileStream ");
                    }
                    await outputStream.FlushAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, Request.RouteValues["action"]?.ToString());
            }
        }

        // GET api/<ReadFile>/5
        //[HttpGet("{id}")]
        //public string Get(int id)
        //{
        //    return "value";
        //}

        //// POST api/<ReadFile>
        //[HttpPost]
        //public void Post([FromBody] string value)
        //{
        //}

        //// PUT api/<ReadFile>/5
        //[HttpPut("{id}")]
        //public void Put(int id, [FromBody] string value)
        //{
        //}

        //// DELETE api/<ReadFile>/5
        //[HttpDelete("{id}")]
        //public void Delete(int id)
        //{
        //}
    }
}
