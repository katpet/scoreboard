package com.carolinarollergirls.scoreboard.core.game;

import static org.junit.Assert.assertEquals;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.util.ArrayList;
import java.util.List;

import com.carolinarollergirls.scoreboard.core.ScoreBoardImpl;
import com.carolinarollergirls.scoreboard.core.interfaces.BoxSeat;
import com.carolinarollergirls.scoreboard.core.interfaces.Clock;
import com.carolinarollergirls.scoreboard.core.interfaces.CurrentGame;
import com.carolinarollergirls.scoreboard.core.interfaces.Fielding;
import com.carolinarollergirls.scoreboard.core.interfaces.Game;
import com.carolinarollergirls.scoreboard.core.interfaces.PreparedTeam.PreparedSkater;
import com.carolinarollergirls.scoreboard.core.interfaces.ScoreBoard;
import com.carolinarollergirls.scoreboard.core.interfaces.Skater;
import com.carolinarollergirls.scoreboard.core.interfaces.Team;
import com.carolinarollergirls.scoreboard.core.prepared.PreparedTeamImpl.PreparedTeamSkaterImpl;
import com.carolinarollergirls.scoreboard.event.ScoreBoardEvent;
import com.carolinarollergirls.scoreboard.event.ScoreBoardEventProviderImpl;
import com.carolinarollergirls.scoreboard.event.ScoreBoardListener;
import com.carolinarollergirls.scoreboard.rules.Rule;
import com.carolinarollergirls.scoreboard.utils.ScoreBoardClock;

public class BoxSeatImplTests {

    private ScoreBoard sb;
    private Game g;
    private Clock pc;
    private Team t1;
    private Team t2;
    private Skater s1_t1;
    private Skater s1_t2;
    private String s1_t1_id;
    private String s1_t2_id;

    private int batchLevel;
    private ScoreBoardListener batchCounter = new ScoreBoardListener() {
        @Override
        public void scoreBoardChange(ScoreBoardEvent<?> event) {
            synchronized (batchCounter) {
                if (event.getProperty() == ScoreBoardEventProviderImpl.BATCH_START) {
                    batchLevel++;
                } else if (event.getProperty() == ScoreBoardEventProviderImpl.BATCH_END) {
                    batchLevel--;
                }
            }
        }
    };

    @Before
    public void setUp() throws Exception {
        GameImpl.setQuickClockThreshold(0L);
        sb = new ScoreBoardImpl();
        sb.postAutosaveUpdate();
        g = sb.getCurrentGame().get(CurrentGame.GAME);
        pc = g.getClock(Clock.ID_PERIOD);
        sb.addScoreBoardListener(batchCounter);

        ScoreBoardClock.getInstance().stop();
        t1 = g.getTeam(Team.ID_1);
        t2 = g.getTeam(Team.ID_2);
        s1_t1_id = "11";
        s1_t2_id = "22";

        PreparedSkater pts;
        pts = new PreparedTeamSkaterImpl(null, s1_t1_id);
        pts.set(Skater.ROSTER_NUMBER, s1_t1_id);
        pts.set(Skater.NAME, "Uno");
        pts.set(Skater.FLAGS, "ALT");
        s1_t1 = new SkaterImpl(t1, pts, null);

        pts = new PreparedTeamSkaterImpl(null, s1_t2_id);
        pts.set(Skater.ROSTER_NUMBER, s1_t2_id);
        pts.set(Skater.NAME, "Dos");
        pts.set(Skater.FLAGS, "ALT");
        s1_t2 = new SkaterImpl(t2, pts, null);

        t1.addSkater(s1_t1);
        t2.addSkater(s1_t2);

        assertEquals(s1_t1.getRosterNumber(), s1_t1_id);
        assertEquals(s1_t2.getRosterNumber(), s1_t2_id);

        g.startJam();
        pc = g.getClock(Clock.ID_PERIOD);
    }

    @After
    public void tearDown() throws Exception {
        ScoreBoardClock.getInstance().start(false);
        // Check all started batches were ended.
        assertEquals(0, batchLevel);
        t1.stopJam();
        GameImpl.setQuickClockThreshold(1000L);
    }

    @Test
    public void testBoxSeatCount() {
        List<BoxSeat> boxseats1 = new ArrayList<>(t1.getAll(Team.BOX_SEAT));
        List<BoxSeat> boxseats2 = new ArrayList<>(t2.getAll(Team.BOX_SEAT));
        long numExpectedBoxSeatsPerTeam = 4;
        assertEquals(boxseats1.size(), numExpectedBoxSeatsPerTeam);
        assertEquals(boxseats2.size(), numExpectedBoxSeatsPerTeam);
    }

    @Test
    public void testStartBoxClock() {
        // Skater number can be assigned to a seat before or after the seat's timer starts,
        // so test both of those scenarios.

        BoxSeat bs1_t1 = t1.getBoxSeat(BoxSeat.BoxSeatId.BLOCKER1);

        // Set which skater is in the box before starting the timer.
        bs1_t1.setBoxSkater(s1_t1_id);
        assertEquals(bs1_t1.getSkater().getRosterNumber(), s1_t1_id);
        bs1_t1.startBox();
        assertEquals(bs1_t1.started(), true);
        assertEquals(bs1_t1.getBoxClock().isRunning(), true);
        bs1_t1.stopBox();
        assertEquals(bs1_t1.getBoxClock().isRunning(), false);
        bs1_t1.startBox();
        assertEquals(bs1_t1.getBoxClock().isRunning(), true);

        BoxSeat bs1_t2 = t2.getBoxSeat(BoxSeat.BoxSeatId.BLOCKER1);

        // Start timing before adding skater, which will be a common scenario.
        bs1_t2.startBox();
        bs1_t2.setBoxSkater(s1_t2_id);
        assertEquals(bs1_t2.started(), true);
        assertEquals(bs1_t2.getSkater().getRosterNumber(), s1_t2_id);
        assertEquals(bs1_t2.getBoxClock().isRunning(), true);
        bs1_t2.stopBox();
        assertEquals(bs1_t2.getBoxClock().isRunning(), false);

    }
    
    @Test
    public void testPenaltyCount() {
        // Put a skater in box, and check that penalty count went up by one
        // when the box time is ended.
        BoxSeat bs2 = t1.getBoxSeat(BoxSeat.BoxSeatId.BLOCKER2);
        bs2.setBoxSkater(s1_t1_id);
        bs2.startBox();
        Fielding f1 = t1.getPosition(bs2.getFloorPosition()).getCurrentFielding();
        assertEquals(f1 != null, true);
        bs2.endBox();
        assertEquals(s1_t1.getPenaltyCount(g.getCurrentPeriodNumber()), 1);

        // Same as above, but check that the penalty count is now 2
        bs2.setBoxSkater(s1_t1_id);
        bs2.startBox();
        Fielding f2 = t1.getPosition(bs2.getFloorPosition()).getCurrentFielding();
        assertEquals(f2 != null, true);
        bs2.endBox();
        assertEquals(s1_t1.getPenaltyCount(g.getCurrentPeriodNumber()), 2);

        // Test that the count goes from 2 to 4 for a double penalty
        bs2.setBoxSkater(s1_t1_id);
        bs2.startBox();
        bs2.setBoxTimeChange(g.getLong(Rule.PENALTIES_DURATION)/1000); // expects seconds
        Fielding f3 = t1.getPosition(bs2.getFloorPosition()).getCurrentFielding();
        assertEquals(f3 != null, true);
        bs2.endBox();
        assertEquals(s1_t1.getPenaltyCount(g.getCurrentPeriodNumber()), 4);

        // Test that adding and then removing time doesn't double the penalty
        bs2.setBoxSkater(s1_t1_id);
        bs2.startBox();
        bs2.setBoxTimeChange(g.getLong(Rule.PENALTIES_DURATION)/1000);
        bs2.setBoxTimeChange(g.getLong(Rule.PENALTIES_DURATION)/-1000);
        Fielding f4 = t1.getPosition(bs2.getFloorPosition()).getCurrentFielding();
        assertEquals(f4 != null, true);
        bs2.endBox();
        assertEquals(s1_t1.getPenaltyCount(g.getCurrentPeriodNumber()), 5);        

        g.stopJamTO();

        // Between jams, put a skater in box and end their trip.
        // Check that this does not add to their penalty count.
        bs2.setBoxSkater(s1_t1_id);
        bs2.startBox();
        Fielding f5= t1.getPosition(bs2.getFloorPosition()).getCurrentFielding();
        assertEquals(f5 != null, true);
        bs2.endBox();
        assertEquals(s1_t1.getPenaltyCount(g.getCurrentPeriodNumber()), 5);
    }

    @Test
    public void testResetBox() {
        // Put a skater in box, then reset and check that everything is back to initial state
        BoxSeat bs1 = t1.getBoxSeat(BoxSeat.BoxSeatId.BLOCKER1);
        bs1.setBoxSkater(s1_t1_id);
        bs1.startBox();
        Fielding f1 = t1.getPosition(bs1.getFloorPosition()).getCurrentFielding();
        assertEquals(f1 != null, true);
        bs1.resetBox();
        assertEquals(bs1.getSkater(), null);
        assertEquals(bs1.getBoxClock().isRunning(), false);
        assertEquals(bs1.getBoxClock().getMaximumTime(), g.getLong(Rule.PENALTIES_DURATION));
    }

    @Test
    public void testJammers() {
        BoxSeat bs0_t1 = t1.getBoxSeat(BoxSeat.BoxSeatId.JAMMER);
        bs0_t1.startBox();
        bs0_t1.getBoxClock().setTime(1200);
        assertEquals(bs0_t1.getBoxClock().isRunning(), true);        
        BoxSeat bs0_t2 = t2.getBoxSeat(BoxSeat.BoxSeatId.JAMMER);
        bs0_t2.startBox();
        // Wait a few milliseconds for the box clocks to update
        ScoreBoardClock.getInstance().advance(1000);
        // Starting second jammer's clock should cause stopping and resetting first jammer's clock
        assertEquals(bs0_t1.getBoxClock().getTime(), g.getLong(Rule.PENALTIES_DURATION));
        assertEquals(bs0_t1.getBoxClock().isRunning(), false);
        assertEquals(bs0_t2.getBoxClock().isRunning(), true);
    }
}
