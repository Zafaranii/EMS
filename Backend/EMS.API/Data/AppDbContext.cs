using EMS.API.Models;
using Microsoft.EntityFrameworkCore;

namespace EMS.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Hotel> Hotels => Set<Hotel>();
    public DbSet<ConferenceRoom> ConferenceRooms => Set<ConferenceRoom>();
    public DbSet<RoomTimeSlot> RoomTimeSlots => Set<RoomTimeSlot>();
    public DbSet<Sector> Sectors => Set<Sector>();
    public DbSet<Investor> Investors => Set<Investor>();
    public DbSet<InvestorSectorAvailability> InvestorSectorAvailability => Set<InvestorSectorAvailability>();
    public DbSet<Presenter> Presenters => Set<Presenter>();
    public DbSet<PresenterSectorAvailability> PresenterSectorAvailability => Set<PresenterSectorAvailability>();
    public DbSet<Reservation> Reservations => Set<Reservation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Hotel>().ToTable("Hotels").HasKey(x => x.HotelId);
        modelBuilder.Entity<ConferenceRoom>().ToTable("ConferenceRooms").HasKey(x => x.RoomId);
        modelBuilder.Entity<RoomTimeSlot>().ToTable("RoomTimeSlots").HasKey(x => x.SlotId);
        modelBuilder.Entity<Sector>().ToTable("Sectors").HasKey(x => x.SectorId);
        modelBuilder.Entity<Investor>().ToTable("Investors").HasKey(x => x.InvestorId);
        modelBuilder.Entity<InvestorSectorAvailability>().ToTable("InvestorSectorAvailability").HasKey(x => x.Id);
        modelBuilder.Entity<Presenter>().ToTable("Presenters").HasKey(x => x.PresenterId);
        modelBuilder.Entity<PresenterSectorAvailability>().ToTable("PresenterSectorAvailability").HasKey(x => x.Id);
        modelBuilder.Entity<Reservation>().ToTable("Reservations").HasKey(x => x.ReservationId);

        modelBuilder.Entity<RoomTimeSlot>().Property(x => x.StartTime).HasColumnType("time");
        modelBuilder.Entity<RoomTimeSlot>().Property(x => x.EndTime).HasColumnType("time");
        modelBuilder.Entity<RoomTimeSlot>().Property(x => x.SlotDate).HasColumnType("date");
        modelBuilder.Entity<InvestorSectorAvailability>().Property(x => x.StartTime).HasColumnType("time");
        modelBuilder.Entity<InvestorSectorAvailability>().Property(x => x.EndTime).HasColumnType("time");
        modelBuilder.Entity<InvestorSectorAvailability>().Property(x => x.AvailableDate).HasColumnType("date");
        modelBuilder.Entity<PresenterSectorAvailability>().Property(x => x.StartTime).HasColumnType("time");
        modelBuilder.Entity<PresenterSectorAvailability>().Property(x => x.EndTime).HasColumnType("time");
        modelBuilder.Entity<PresenterSectorAvailability>().Property(x => x.AvailableDate).HasColumnType("date");

        modelBuilder.Entity<ConferenceRoom>()
            .HasOne(x => x.Hotel)
            .WithMany(x => x.ConferenceRooms)
            .HasForeignKey(x => x.HotelId);

        modelBuilder.Entity<RoomTimeSlot>()
            .HasOne(x => x.ConferenceRoom)
            .WithMany(x => x.RoomTimeSlots)
            .HasForeignKey(x => x.RoomId);

        modelBuilder.Entity<InvestorSectorAvailability>()
            .HasOne(x => x.Investor)
            .WithMany(x => x.InvestorSectorAvailabilities)
            .HasForeignKey(x => x.InvestorId);

        modelBuilder.Entity<InvestorSectorAvailability>()
            .HasOne(x => x.Sector)
            .WithMany(x => x.InvestorSectorAvailabilities)
            .HasForeignKey(x => x.SectorId);

        modelBuilder.Entity<PresenterSectorAvailability>()
            .HasOne(x => x.Presenter)
            .WithMany(x => x.PresenterSectorAvailabilities)
            .HasForeignKey(x => x.PresenterId);

        modelBuilder.Entity<PresenterSectorAvailability>()
            .HasOne(x => x.Sector)
            .WithMany(x => x.PresenterSectorAvailabilities)
            .HasForeignKey(x => x.SectorId);

        modelBuilder.Entity<Reservation>()
            .HasOne(x => x.Investor)
            .WithMany(x => x.Reservations)
            .HasForeignKey(x => x.InvestorId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Reservation>()
            .HasOne(x => x.Presenter)
            .WithMany(x => x.Reservations)
            .HasForeignKey(x => x.PresenterId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Reservation>()
            .HasOne(x => x.Slot)
            .WithMany(x => x.Reservations)
            .HasForeignKey(x => x.SlotId);

        modelBuilder.Entity<Reservation>()
            .HasOne(x => x.Sector)
            .WithMany(x => x.Reservations)
            .HasForeignKey(x => x.SectorId);

        modelBuilder.Entity<RoomTimeSlot>()
            .HasIndex(x => new { x.RoomId, x.SlotDate, x.IsBooked, x.StartTime })
            .HasDatabaseName("IX_RoomSlots_RoomId_IsBooked");

        modelBuilder.Entity<InvestorSectorAvailability>()
            .HasIndex(x => new { x.InvestorId, x.SectorId })
            .HasDatabaseName("IX_InvSec");

        modelBuilder.Entity<PresenterSectorAvailability>()
            .HasIndex(x => new { x.PresenterId, x.SectorId })
            .HasDatabaseName("IX_PresSec");
    }
}
