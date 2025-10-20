package com.foongdoll.backend.common.util;

import java.time.*;
import java.time.format.DateTimeFormatter;

public final class TimeUtils {
    private TimeUtils() {}

    public static OffsetDateTime now() {
        return OffsetDateTime.now(ZoneId.of("Asia/Seoul"));
    }

    public static String formatIso(OffsetDateTime odt) {
        return odt == null ? null : odt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }
}