namespace ChatRooms.Client
{
    public record VideoChunk(byte[] Chunk, ulong Timestamp, string ChunkType, bool IsLastChunk);
}
