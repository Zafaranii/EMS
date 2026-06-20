namespace EMS.API.DTOs;

public class ConferenceRoomDetailsDto
{
    public int RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public List<RoomTimeSlotDetailsDto> Slots { get; set; } = new();
}
