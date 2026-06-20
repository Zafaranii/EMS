namespace EMS.API.Services.Common;

public enum ServiceResultType
{
    Success,
    BadRequest,
    Conflict,
    NotFound,
}

public class ServiceResult<T>
{
    public ServiceResultType Type { get; init; }
    public T? Data { get; init; }
    public string? Message { get; init; }

    public static ServiceResult<T> Success(T data) => new() { Type = ServiceResultType.Success, Data = data };
    public static ServiceResult<T> BadRequest(string message) => new() { Type = ServiceResultType.BadRequest, Message = message };
    public static ServiceResult<T> Conflict(string message) => new() { Type = ServiceResultType.Conflict, Message = message };
    public static ServiceResult<T> NotFound(string message) => new() { Type = ServiceResultType.NotFound, Message = message };
}
