package com.carolinarollergirls.scoreboard.core.game;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;

import org.junit.Before;
import org.junit.Test;

import com.carolinarollergirls.scoreboard.core.ScoreBoardImpl;
import com.carolinarollergirls.scoreboard.core.interfaces.CurrentGame;
import com.carolinarollergirls.scoreboard.core.interfaces.Fielding;
import com.carolinarollergirls.scoreboard.core.interfaces.FloorPosition;
import com.carolinarollergirls.scoreboard.core.interfaces.Position;
import com.carolinarollergirls.scoreboard.core.interfaces.ScoreBoard;
import com.carolinarollergirls.scoreboard.core.interfaces.Skater;
import com.carolinarollergirls.scoreboard.core.interfaces.Team;

public class PositionImplTests {
    private final String firstId = "662caf51-17da-4ef2-8f01-a6d7e1c30d56";
    private final String secondId = "91a6c3f5-8258-46c7-a845-62c21b6e37ca";
    private final String thirdId = "5df0a35b-aaa6-4c30-93ef-07ba4f174cdc";

    private ScoreBoard sb;
    private Team team;
    private Skater first;
    private Skater second;
    private Skater third;

    @Before
    public void setup() {
        GameImpl.setQuickClockThreshold(0L);
        sb = new ScoreBoardImpl(false);
        sb.postAutosaveUpdate();

        team = sb.getCurrentGame().get(CurrentGame.GAME).getTeam(Team.ID_1);

        first = new SkaterImpl(team, firstId);
        second = new SkaterImpl(team, secondId);
        third = new SkaterImpl(team, thirdId);

        team.addSkater(first);
        team.addSkater(second);
        team.addSkater(third);
    }

    @Test
    public void key_values_populated() {
        Position blocker = team.getPosition(FloorPosition.BLOCKER1);

        assertEquals(blocker.getId(), team.getId() + "_" + FloorPosition.BLOCKER1.toString());
        assertEquals(blocker.getProviderName(), "Position");
        assertEquals(blocker.getProviderId(), FloorPosition.BLOCKER1.toString());
        assertEquals(blocker.getProviderClass(), Position.class);
        assertEquals(blocker.getTeam(), team);
    }

    @Test
    public void make_skater_jammer_via_position() {
        Position jammer = team.getPosition(FloorPosition.JAMMER);
        jammer.setSkater(first);

        assertSame(jammer.getSkater(), first);
    }

    @Test
    public void field_skater_as_jammer() {
        Position jammer = team.getPosition(FloorPosition.JAMMER);
        jammer.setSkater(first);

        assertSame(jammer.getSkater(), first);
        assertSame(first.getPosition(), jammer);
    }

    @Test
    public void position_knows_skater_penalty() {
        Position jammer = team.getPosition(FloorPosition.JAMMER);
        jammer.setSkater(first);
        first.setPenaltyBox(true);

        assertTrue(jammer.isPenaltyBox());
    }

    @Test
    public void skater_knows_position_penalty() {
        Position jammer = team.getPosition(FloorPosition.JAMMER);
        jammer.setSkater(first);
        jammer.setPenaltyBox(true);

        assertTrue(first.isPenaltyBox());
    }

    @Test
    public void doesnt_set_penalty_with_no_skater() {
        Position jammer = team.getPosition(FloorPosition.JAMMER);
        jammer.getCurrentFielding().set(Fielding.NOT_FIELDED, true);
        jammer.setPenaltyBox(true);

        assertFalse(jammer.isPenaltyBox());
    }

    @Test
    public void sp_works() {
        Position jammer = team.getPosition(FloorPosition.JAMMER);
        Position pivot = team.getPosition(FloorPosition.PIVOT);
        jammer.setSkater(first);
        pivot.setSkater(first);

        assertSame(pivot.getSkater(), first);
        assertNull(jammer.getSkater());
    }

    @Test
    public void clears_with_null_skater_id() {
        Position jammer = team.getPosition(FloorPosition.JAMMER);
        jammer.setSkater(first);
        jammer.setSkater(null);

        assertNull(jammer.getSkater());
    }

    @Test
    public void position_knows_penalty_after_sp() {
        Position jammer = team.getPosition(FloorPosition.JAMMER);
        Position pivot = team.getPosition(FloorPosition.PIVOT);
        pivot.setSkater(first);
        pivot.setPenaltyBox(true);
        jammer.setSkater(first);

        assertTrue(jammer.isPenaltyBox());
        assertFalse(pivot.isPenaltyBox());
        assertTrue(first.isPenaltyBox());
    }
}
