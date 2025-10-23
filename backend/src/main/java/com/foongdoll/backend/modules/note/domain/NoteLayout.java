package com.foongdoll.backend.modules.note.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteLayout {

    @Column(name = "layout_x")
    private int x;

    @Column(name = "layout_y")
    private int y;

    @Column(name = "layout_w")
    private int width;

    @Column(name = "layout_h")
    private int height;

    public static NoteLayout defaultLayout() {
        return NoteLayout.builder()
                .x(0)
                .y(0)
                .width(4)
                .height(3)
                .build();
    }
}
