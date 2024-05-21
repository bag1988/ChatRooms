using ChatRooms.Client;
using ChatRooms.Components;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Channels;

namespace ChatRooms
{

    public class ChatHub : Hub
    {
        public static readonly List<UserInfo> users = new();

        private static Dictionary<string, List<string>> messages = new();

        public async Task<bool> StartChat(string userName)
        {
            bool response = false;
            var appId = GetAppId;
            Console.WriteLine("Добавление пользователя {0}", userName);
            lock (users)
            {
                if (users.Any(x => x.AppId == appId))
                {
                    var first = users.First(x => x.AppId == appId);
                    if (!first.ConnectId.Contains(Context.ConnectionId))
                    {
                        first.ConnectId.Add(Context.ConnectionId);
                    }
                    first.UserName = userName;
                    response = true;
                }
            }

            if (response)
            {
                await Clients.Others.SendAsync("AddUser", userName);
            }
            return response;
        }

        public IEnumerable<string?> GetUsers()
        {
            return users.Where(x => !string.IsNullOrEmpty(x.UserName)).Select(x => x.UserName);
        }

        public async Task SendMessageForUser(string outUser, string forUser, string message)
        {
            var appId = GetAppId;

            var caller = users.FirstOrDefault(x => x.UserName == outUser);

            if (caller != null && !string.IsNullOrEmpty(caller.UserName))
            {
                if (messages.ContainsKey(caller.UserName))
                {
                    messages[caller.UserName].Add(message);
                }
                else
                {
                    messages.Add(caller.UserName, [message]);
                }
            }

            if (users.Any(x => x.UserName == forUser))
            {
                if (messages.ContainsKey(forUser))
                {
                    messages[forUser].Add(message);
                }
                else
                {
                    messages.Add(forUser, [message]);
                }
                var r = users.FirstOrDefault(x => x.UserName == forUser)?.ConnectId;
                if (r?.Count > 0)
                {
                    await Clients.Clients(r).SendAsync("ReceiveMessage", outUser, message);
                }
            }
        }

        public IEnumerable<string> GetAllMessagesForUser(string userName)
        {
            Console.WriteLine("Получение сообщений для пользователя {0}", userName);
            return messages.Where(x => x.Key == userName).SelectMany(x => x.Value);
        }

        public async Task SendVideoForUser(string outUser, string forUser)
        {
            if (users.Any(x => x.UserName == forUser))
            {
                var r = users.FirstOrDefault(x => x.UserName == forUser)?.ConnectId;
                if (r?.Count > 0)
                {
                    await Clients.Clients(r).SendAsync("SetRemoteVideo", outUser);
                }
            }
        }

        public async Task SendStopLocalStream(string outUser, string forUser)
        {
            if (users.Any(x => x.UserName == forUser))
            {
                var r = users.FirstOrDefault(x => x.UserName == forUser)?.ConnectId;
                if (r?.Count > 0)
                {
                    await Clients.Clients(r).SendAsync("SetStopRemoteStream", outUser);
                }
            }
        }

        public async Task StreamVideoForChat(string outUser, string forUser, byte[] btoa, ulong timestamp, string chunk_type)
        {
            if (users.Any(x => x.UserName == forUser))
            {
                var r = users.FirstOrDefault(x => x.UserName == forUser)?.ConnectId;
                if (r?.Count > 0)
                {
                    await Clients.Clients(r).SendAsync("SetRemoteVideoChunk", outUser, btoa, timestamp, chunk_type);
                }
            }
        }

        public async Task StreamVideoForChatChannel(string outUser, string forUser, ChannelReader<VideoChunk> stream)
        {
            if (users.Any(x => x.UserName == forUser))
            {
                var r = users.FirstOrDefault(x => x.UserName == forUser)?.ConnectId;
                if (r?.Count > 0)
                {
                    List<byte>? tempVideoChunk = null;
                    while (await stream.WaitToReadAsync())
                    {
                        while (stream.TryRead(out var item))
                        {
                            tempVideoChunk ??= new();

                            tempVideoChunk.AddRange(item.Chunk);
                            Console.WriteLine($"Timestamp {item.Timestamp} is last {item.IsLastChunk}, temp length {tempVideoChunk.Count}");

                            if (item.IsLastChunk)
                            {
                                await Clients.Clients(r).SendAsync("SetRemoteVideoChunk", outUser, tempVideoChunk.ToArray(), item.Timestamp, item.ChunkType);
                                tempVideoChunk = null;
                            }
                        }
                    }
                }
            }
        }

        public async Task SendVideoConfig(string outUser, string forUser, string configJson)
        {
            if (users.Any(x => x.UserName == forUser))
            {
                var r = users.FirstOrDefault(x => x.UserName == forUser)?.ConnectId;
                if (r?.Count > 0)
                {
                    await Clients.Clients(r).SendAsync("SetVideoConfig", outUser, configJson);
                }
            }
        }

        public async Task SendAudioConfig(string outUser, string forUser, string configJson)
        {
            if (users.Any(x => x.UserName == forUser))
            {
                var r = users.FirstOrDefault(x => x.UserName == forUser)?.ConnectId;
                if (r?.Count > 0)
                {
                    await Clients.Clients(r).SendAsync("SetAudioConfig", outUser, configJson);
                }
            }
        }

        public async Task StreamAudioForChat(string outUser, string forUser, byte[] btoa, ulong timestamp, string chunk_type)
        {
            if (users.Any(x => x.UserName == forUser))
            {
                var r = users.FirstOrDefault(x => x.UserName == forUser)?.ConnectId;
                if (r?.Count > 0)
                {
                    await Clients.Clients(r).SendAsync("SetRemoteAudioChunk", outUser, btoa, timestamp, chunk_type);
                }
            }
        }

        string? GetAppId
        {
            get
            {
                string? appId = null;
                var context = Context.GetHttpContext();
                if (context != null)
                {
                    context.Request.Headers.TryGetValue("AppId", out var result);
                    appId = result.FirstOrDefault();
                }
                return appId;
            }
        }

        string? GetUserName
        {
            get
            {
                string? userName = null;
                var context = Context.GetHttpContext();
                if (context != null)
                {
                    context.Request.Query.TryGetValue("user", out var result);
                    userName = result.FirstOrDefault();
                }
                return userName;
            }
        }

        public override Task OnConnectedAsync()
        {
            var appId = GetAppId;
            var userName = GetUserName;
            if (appId != null)
            {
                lock (users)
                {
                    if (users.Any(x => x.AppId == appId))
                    {
                        var first = users.First(x => x.AppId == appId);
                        first.ConnectId.Add(Context.ConnectionId);
                    }
                    else
                    {
                        users.Add(new UserInfo() { AppId = appId, ConnectId = [Context.ConnectionId] });
                    }
                }
            }
            else if (!string.IsNullOrEmpty(userName))
            {
                lock (users)
                {
                    if (users.Any(x => x.UserName == userName))
                    {
                        var first = users.First(x => x.UserName == userName);
                        first.ConnectId.Add(Context.ConnectionId);
                    }
                }
            }

            Console.WriteLine("Подключение нового пользователя {0}", Context.ConnectionId);
            return base.OnConnectedAsync();
        }


        public override Task OnDisconnectedAsync(Exception? exception)
        {
            var appId = GetAppId;
            var userName = GetUserName;
            Console.WriteLine("Отключение пользователя {0}", Context.ConnectionId);
            if (appId != null)
            {
                lock (users)
                {
                    if (users.Any(x => x.AppId == appId))
                    {
                        var first = users.First(x => x.AppId == appId);
                        first.ConnectId.Remove(Context.ConnectionId);
                    }
                }
            }
            else if (!string.IsNullOrEmpty(userName))
            {
                lock (users)
                {
                    if (users.Any(x => x.UserName == userName))
                    {
                        var first = users.First(x => x.UserName == userName);
                        first.ConnectId.Remove(Context.ConnectionId);
                    }
                }
            }

            return base.OnDisconnectedAsync(exception);
        }
    }
}
