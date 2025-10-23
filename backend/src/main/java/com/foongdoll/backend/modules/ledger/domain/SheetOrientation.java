package com.foongdoll.backend.modules.ledger.domain;

public enum SheetOrientation {
    LANDSCAPE,
    PORTRAIT;

    public static SheetOrientation orDefault(SheetOrientation orientation, SheetOrientation fallback) {
        return orientation != null ? orientation : fallback;
    }
}
