package com.carolinarollergirls.scoreboard.core.interfaces;

import java.util.ArrayList;
import java.util.Collection;

import com.carolinarollergirls.scoreboard.event.Command;
import com.carolinarollergirls.scoreboard.event.Property;
import com.carolinarollergirls.scoreboard.event.ScoreBoardEventProvider;
import com.carolinarollergirls.scoreboard.event.Value;

public interface BoxSeat extends ScoreBoardEventProvider {
    public Skater getSkater();
    public void setSkater(Skater s);
    public String getBoxClockId();
    public Clock getBoxClock();
    public FloorPosition getFloorPosition();
    public void endBox();
    public void startBox();
    public void stopBox();
    public void resetBox();
    public void setBoxSkater(String number);
    public void setBoxTimeChange(long secs);
    public boolean started();

    public static Collection<Property<?>> props = new ArrayList<>();
    public static final Value<Skater> SKATER = new Value<>(Skater.class, "Skater", null, props);
    public static final Value<String> BOX_SKATER = new Value<>(String.class, "BoxSkater", "", props);
    public static final Value<Integer> BOX_TIME_CHANGE = new Value<>(Integer.class, "BoxTimeChange", 0, props);
    public static final Value<Integer> BOX_SKATER_PENALTIES = new Value<>(Integer.class, "BoxSkaterPenalties", 0, props);

    public static final Command START_BOX = new Command("StartBox", props);
    public static final Command STOP_BOX = new Command("StopBox", props);
    public static final Command RESET_BOX = new Command("ResetBox", props);

    public enum BoxSeatId {
        JAMMER("Jammer"),
        BLOCKER1("Blocker1"),
        BLOCKER2("Blocker2"),
        BLOCKER3("Blocker3");

        private BoxSeatId(String i) { id = i; }
        @Override
        public String toString() {
            return id;
        }

        private String id;
    }    
}
