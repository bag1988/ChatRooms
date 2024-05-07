namespace ChatRooms
{
    public class UserInfo
    {
        public string? UserName { get; set; }
        public List<string> ConnectId { get; set; } = new();
        public string? AppId { get; set; }
    }

}
