package com.cinema.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;

@Service
public class DatabaseBackupService {

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    @Value("${app.database.name:cinema_db1}")
    private String databaseName;

    @Value("${app.backup.directory:C:/CinemaBackups}")
    private String backupDirectory;

    private static final DateTimeFormatter FILE_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    private static final DateTimeFormatter DISPLAY_TIME_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");


    // =========================================================
    // LẤY DANH SÁCH FILE BACKUP
    // =========================================================

    public List<Map<String, Object>> getAllBackups() throws IOException {

        Path directory = getBackupDirectoryPath();

        Files.createDirectories(directory);

        try (Stream<Path> files = Files.list(directory)) {

            return files
                    .filter(Files::isRegularFile)
                    .filter(path ->
                            path.getFileName()
                                    .toString()
                                    .toLowerCase()
                                    .endsWith(".bak")
                    )
                    .sorted(
                            Comparator.comparingLong(
                                    this::getLastModifiedSafe
                            ).reversed()
                    )
                    .map(this::convertFileToResponse)
                    .toList();
        }
    }


    // =========================================================
    // TẠO BACKUP THỦ CÔNG
    // =========================================================

    public Map<String, Object> createManualBackup() throws Exception {
        return createBackup("MANUAL");
    }


    // =========================================================
    // HÀM TẠO FILE BACKUP
    // =========================================================

    private Map<String, Object> createBackup(String backupType)
            throws Exception {

        Path directory = getBackupDirectoryPath();

        Files.createDirectories(directory);

        String timestamp =
                LocalDateTime.now().format(FILE_TIME_FORMAT);

        String fileName =
                databaseName
                        + "_"
                        + backupType
                        + "_"
                        + timestamp
                        + ".bak";

        Path backupPath =
                directory.resolve(fileName).normalize();

        String safeDatabaseName =
                databaseName.replace("]", "]]");

        String safeBackupPath =
                backupPath.toAbsolutePath()
                        .toString()
                        .replace("'", "''");

        String backupSql =
        "BACKUP DATABASE ["
                + safeDatabaseName
                + "] TO DISK = N'"
                + safeBackupPath
                + "' WITH INIT, CHECKSUM, STATS = 10";

        try (
                Connection connection = DriverManager.getConnection(
                        getMasterDatabaseUrl(),
                        datasourceUsername,
                        datasourcePassword
                );

                Statement statement = connection.createStatement()
        ) {

            statement.setQueryTimeout(600);
            statement.execute(backupSql);
        }

        if (!Files.exists(backupPath)) {
            throw new IOException(
                    "SQL Server đã chạy lệnh backup nhưng không tìm thấy file: "
                            + backupPath
            );
        }

        return convertFileToResponse(backupPath);
    }


    // =========================================================
    // PHỤC HỒI DATABASE
    // =========================================================

    public Map<String, Object> restoreBackup(String fileName)
            throws Exception {

        Path directory = getBackupDirectoryPath();

        String safeFileName =
                Paths.get(fileName).getFileName().toString();

        if (!safeFileName.toLowerCase().endsWith(".bak")) {
            throw new IllegalArgumentException(
                    "File phục hồi không hợp lệ"
            );
        }

        Path backupPath =
                directory.resolve(safeFileName).normalize();

        if (!backupPath.startsWith(directory)) {
            throw new IllegalArgumentException(
                    "Đường dẫn file không hợp lệ"
            );
        }

        if (!Files.exists(backupPath)) {
            throw new IllegalArgumentException(
                    "Không tìm thấy bản sao lưu: " + safeFileName
            );
        }

        /*
         * Tạo một bản backup an toàn của database hiện tại
         * trước khi tiến hành Restore.
         */
        Map<String, Object> safetyBackup =
                createBackup("PRE_RESTORE");

        String safeDatabaseName =
                databaseName.replace("]", "]]");

        String safeBackupPath =
                backupPath.toAbsolutePath()
                        .toString()
                        .replace("'", "''");

        String setSingleUserSql =
                "ALTER DATABASE ["
                        + safeDatabaseName
                        + "] SET SINGLE_USER WITH ROLLBACK IMMEDIATE";

        String restoreSql =
                "RESTORE DATABASE ["
                        + safeDatabaseName
                        + "] FROM DISK = N'"
                        + safeBackupPath
                        + "' WITH REPLACE, RECOVERY, STATS = 10";

        String setMultiUserSql =
                "ALTER DATABASE ["
                        + safeDatabaseName
                        + "] SET MULTI_USER";

        try (
                Connection connection = DriverManager.getConnection(
                        getMasterDatabaseUrl(),
                        datasourceUsername,
                        datasourcePassword
                );

                Statement statement = connection.createStatement()
        ) {

            statement.setQueryTimeout(900);

            try {
                statement.execute(setSingleUserSql);
                statement.execute(restoreSql);
            } finally {
                try {
                    statement.execute(setMultiUserSql);
                } catch (Exception multiUserError) {
                    System.err.println(
                            "Không thể trả database về MULTI_USER: "
                                    + multiUserError.getMessage()
                    );
                }
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("success", true);
        response.put(
                "message",
                "Phục hồi database thành công. Hãy restart Spring Boot."
        );
        response.put("restoredFile", safeFileName);
        response.put(
                "safetyBackup",
                safetyBackup.get("ver")
        );

        return response;
    }


    // =========================================================
    // CHUYỂN THÔNG TIN FILE THÀNH JSON
    // =========================================================

    private Map<String, Object> convertFileToResponse(Path file) {

        Map<String, Object> result = new LinkedHashMap<>();

        String fileName =
                file.getFileName().toString();

        long sizeBytes = getFileSizeSafe(file);

        double sizeMb =
                sizeBytes / (1024.0 * 1024.0);

        LocalDateTime modifiedTime =
                LocalDateTime.ofInstant(
                        java.time.Instant.ofEpochMilli(
                                getLastModifiedSafe(file)
                        ),
                        ZoneId.systemDefault()
                );

        String type;

        if (fileName.contains("_PRE_RESTORE_")) {
            type = "An toàn trước phục hồi";
        } else if (fileName.contains("_AUTO_")) {
            type = "Tự động";
        } else {
            type = "Thủ công";
        }

        result.put("ver", fileName);
        result.put(
                "date",
                modifiedTime.format(DISPLAY_TIME_FORMAT)
        );
        result.put(
                "size",
                String.format(
                        Locale.US,
                        "%.2f MB",
                        sizeMb
                )
        );
        result.put("type", type);

        return result;
    }


    // =========================================================
    // LẤY URL KẾT NỐI DATABASE MASTER
    // =========================================================

    private String getMasterDatabaseUrl() {

        if (
                datasourceUrl
                        .toLowerCase()
                        .contains("databasename=")
        ) {
            return datasourceUrl.replaceAll(
                    "(?i)databaseName=[^;]*",
                    "databaseName=master"
            );
        }

        String separator =
                datasourceUrl.endsWith(";") ? "" : ";";

        return datasourceUrl
                + separator
                + "databaseName=master";
    }


    // =========================================================
    // TIỆN ÍCH FILE
    // =========================================================

    private Path getBackupDirectoryPath() {
        return Paths.get(backupDirectory)
                .toAbsolutePath()
                .normalize();
    }

    private long getLastModifiedSafe(Path path) {
        try {
            return Files.getLastModifiedTime(path)
                    .toMillis();
        } catch (IOException exception) {
            return 0L;
        }
    }

    private long getFileSizeSafe(Path path) {
        try {
            return Files.size(path);
        } catch (IOException exception) {
            return 0L;
        }
    }
}